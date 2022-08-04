use color_eyre::Result;
use dotenv::dotenv;
use std::collections::HashMap;
use std::env;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex, MutexGuard};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::tungstenite::Message;

use futures_channel::mpsc::{unbounded, UnboundedSender};
use futures_util::{future, pin_mut, stream::TryStreamExt, StreamExt};

mod client;
mod host;

use client::connect_to_host;
use host::new_host;

use crate::host::pause;
use crate::host::play;

//pub type PeerMap = Arc<Mutex<HashMap<SocketAddr, Tx>>>;
pub type Tx = UnboundedSender<Message>;
pub type SessionMap = Arc<Mutex<HashMap<u8, HashMap<SocketAddr, Tx>>>>;
pub type HostMap = Arc<Mutex<HashMap<SocketAddr, u8>>>;

async fn handle_client(
    sessions: SessionMap,
    hosts: HostMap,
    raw_stream: TcpStream,
    addr: SocketAddr,
) -> Result<()> {
    let ws_stream = tokio_tungstenite::accept_async(raw_stream).await?;
    println!("Websocket connection established {}", addr);
    // creates a mspc channel for communicating between async tasks
    let (sender, reciever) = unbounded();

    // sink is a value in which other values can be put.
    // stream is a sequence of value-producing events.
    let (write, read) = ws_stream.split();

    // for each msg in sink
    let broadcast_incoming = read.try_for_each(|msg| {
        let msg = msg.to_text().unwrap();
        println!("Recieved msg from {}: {}", &addr, &msg);

        match msg.parse::<u8>() {
            Ok(id) => {
                println!("connecting client to {}", &id);
                connect_to_host(id, sessions.clone(), addr, sender.clone()).unwrap();
            }
            Err(_e) => {
                match msg {
                    "host" => {
                        println!("client wants to host");
                        new_host(sessions.clone(), hosts.clone(), addr, sender.clone()).unwrap();
                    }
                    "pause" => {
                        println!("host want to pause");
                        pause(sessions.clone(), hosts.clone(), &addr).unwrap();
                    }
                    "play" => {
                        println!("host want to play");
                        play(sessions.clone(), hosts.clone(), &addr).unwrap();
                    }
                    _ => {
                        println!("skipped host ");
                    }
                }
            }
        }

        future::ok(())
    });

    // gathers all unbound calls and sends them
    let recieve_from_others = reciever.map(Ok).forward(write);

    pin_mut!(broadcast_incoming, recieve_from_others);
    future::select(broadcast_incoming, recieve_from_others).await;

    println!("{} dc", &addr);
    Ok(())
}

#[tokio::main]
async fn main() -> Result<()> {
    color_eyre::install()?;
    dotenv().ok();

    // holds the number of current hosts
    let session_map = SessionMap::new(Mutex::new(HashMap::new()));
    let host_map = HostMap::new(Mutex::new(HashMap::new()));

    let address = env::var("ADDRESS").unwrap();
    let port = env::var("PORT").unwrap();
    let curr_addr = format!("{}:{}", address, port);

    let listener = TcpListener::bind(&curr_addr).await?;
    println!("Listening on {}", &curr_addr);

    while let Ok((stream, addr)) = listener.accept().await {
        tokio::spawn(handle_client(session_map.clone(), host_map.clone(), stream, addr));
    }

    Ok(())
}
