use color_eyre::Result;
use futures_channel::mpsc::unbounded;
use futures_util::{future, pin_mut, stream::TryStreamExt, StreamExt};
use tokio_tungstenite::tungstenite::connect;
use std::net::SocketAddr;
use tokio::net::TcpStream;

use crate::{SessionMap, UrlMap};
use crate::client::connect_to_host;
use crate::host::{new_host, send_request};
use crate::requests::{HostRequest, EstablishClient};


// TODO
// handle dc's correclty; clear session map
// if host dc's; dc guests aswell

enum ClientType {
    Host,
    Guest,
}

pub async fn handle_client(
    sessions: SessionMap,
    urls: UrlMap,
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

    let mut client_type: Option<ClientType> = None;

    // for each msg in sink
    let broadcast_incoming = read.try_for_each(|msg| {
        let msg = msg.to_text().unwrap();
        // if msg is empty drop em
        if msg.is_empty() {
            println!("{} dc", &addr);
            return future::ok(());
        }

        println!("Recieved msg from {}: {}", &addr, &msg);

        // if client is already established
        if let Some(client) = &client_type {
            match client {
                ClientType::Host => {
                    // forward the request to all guests in session
                    let msg: HostRequest = serde_json::from_str(msg).unwrap();
                    send_request(msg, sessions.clone(), urls.clone()).unwrap();
                },
                ClientType::Guest => {
                    println!("Error: guest should not be sending data");
                },
            }
        } else {
            // client isnt established yet
            let msg: EstablishClient = serde_json::from_str(msg).unwrap();
            if msg.client == *"host" {
                client_type = Some(ClientType::Host);
                let url = msg.url.unwrap();
                new_host(url, sessions.clone(), urls.clone(), addr, sender.clone()).unwrap();
            } else if msg.client == *"guest" {
                client_type = Some(ClientType::Guest);
                if let Some(id) = msg.id {
                    let id = id.parse::<u8>().unwrap();
                    connect_to_host(id, sessions.clone(), urls.clone(), addr, sender.clone()).unwrap();
                    println!("guest connected to: {}", id);
                }
            } else {
                println!("Error: dropping {}", &addr);
                return future::ok(())
            }
        }

        future::ok(())
    });

    // gathers all unbound calls and sends them
    let recieve_from_others = reciever.map(Ok).forward(write);

    pin_mut!(broadcast_incoming, recieve_from_others);
    future::select(broadcast_incoming, recieve_from_others).await;

    println!("{} end func", &addr);
    Ok(())
}
