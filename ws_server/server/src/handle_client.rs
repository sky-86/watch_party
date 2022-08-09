use color_eyre::Result;
use futures_channel::mpsc::unbounded;
use futures_util::{future, pin_mut, stream::TryStreamExt, StreamExt};
use std::net::SocketAddr;
use tokio::net::TcpStream;

use crate::{HostMap, SessionMap};

use crate::client::connect_to_host;
use crate::host::new_host;
use crate::host::send_request;


pub async fn handle_client(
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
            Err(_e) => match msg {
                "host" => {
                    println!("client wants to host");
                    new_host(sessions.clone(), hosts.clone(), addr, sender.clone()).unwrap();
                }
                "pause" => {
                    println!("host want to pause");
                    send_request("pause".into(), sessions.clone(), hosts.clone(), &addr).unwrap();
                }
                "play" => {
                    println!("host want to play");
                    send_request("play".into(), sessions.clone(), hosts.clone(), &addr).unwrap();
                }
                _ => {
                    println!("skipped host ");
                }
            },
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
