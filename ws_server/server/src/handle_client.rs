use color_eyre::Result;
use futures_channel::mpsc::unbounded;
use futures_util::{future, pin_mut, stream::TryStreamExt, StreamExt};
use tokio_tungstenite::tungstenite::connect;
use std::net::SocketAddr;
use tokio::net::TcpStream;
use serde::{Serialize, Deserialize};

use crate::{HostMap, SessionMap, StateMap};

use crate::client::connect_to_host;
use crate::host::{new_host, send_request, update_guest_state, save_state};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct VideoState {
    pub url: String,
    pub time: f32,
    pub paused: bool,
    pub buffering: bool, 
}

enum ClientType {
    Host,
    Guest,
}

pub async fn handle_client(
    sessions: SessionMap,
    hosts: HostMap,
    state_map: StateMap,
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
        println!("Recieved msg from {}: {}", &addr, &msg);

        match &client_type {
            Some(client) => {
                match client {
                    ClientType::Host => {
                        if msg.is_empty() {
                        } else {
                            match msg {
                                "play" => {}
                                "pause" => {}
                                _ => {
                                    let state: VideoState = serde_json::from_str(msg).unwrap();
                                    save_state(state_map.clone(), state, hosts.clone(), &addr).unwrap();
                                }
                            }
                        }
                    },
                    ClientType::Guest => {
                        match msg.parse::<u8>() {
                            Ok(id) => {
                                connect_to_host(id, sessions.clone(), addr, sender.clone()).unwrap();
                                update_guest_state(id, state_map.clone(), sessions.clone(), &addr).unwrap();
                            },
                            Err(_e) => {},
                        }
                    },
                }
            },
            None => {
                match msg {
                    "host" => {
                        client_type = Some(ClientType::Host);
                        new_host(sessions.clone(), hosts.clone(), addr, sender.clone()).unwrap();
                    },
                    "guest" => {
                        client_type = Some(ClientType::Guest);
                    },
                    _ => client_type = None,
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
