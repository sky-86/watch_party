use color_eyre::Result;
use futures_channel::mpsc::{unbounded, UnboundedSender};
use futures_util::{future, pin_mut, stream::TryStreamExt, StreamExt};
use rand::prelude::*;
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex, MutexGuard};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::tungstenite::Message;
use tokio_tungstenite::WebSocketStream;

use crate::{HostMap, SessionMap};

pub fn new_host(
    sessions: SessionMap,
    hosts: HostMap,
    addr: SocketAddr,
    sender: UnboundedSender<Message>,
) -> Result<()> {
    // generate a host id
    let mut rng = thread_rng();
    let id = rng.gen::<u8>();
    println!("generated id {}", id);

    // send the client the host id
    sender.unbounded_send(Message::Text(id.to_string()))?;

    // create a new stored session;
    sessions
        .lock()
        .unwrap()
        .insert(id, HashMap::from([(addr, sender)]));
    hosts.lock().unwrap().insert(addr, id);

    Ok(())
}

pub fn pause(sessions: SessionMap, hosts: HostMap, curr_addr: &SocketAddr) -> Result<()> {
    // find the party id of the host
    let id: u8 = hosts
        .lock()
        .unwrap()
        .iter()
        .filter(|(addr, _id)| addr == &curr_addr)
        .map(|(_addr, id)| *id)
        .next()
        .unwrap();

    println!("{}", id);

        
    // find the associated session
    for (t_id, party) in sessions.lock().unwrap().iter() {
        if t_id == &id {
            party.iter().for_each(|(addr, sender)| {
                println!("sending pause request to {}", addr);
                let msg = Message::Text("pause".to_string());
                sender.unbounded_send(msg).unwrap();
            })
        }
    }

    Ok(())
}

pub fn play(sessions: SessionMap, hosts: HostMap, curr_addr: &SocketAddr) -> Result<()> {
    // find the party id of the host
    let id: u8 = hosts
        .lock()
        .unwrap()
        .iter()
        .filter(|(addr, _id)| addr == &curr_addr)
        .map(|(_addr, id)| *id)
        .next()
        .unwrap();

    println!("{}", id);

        
    // find the associated session
    for (t_id, party) in sessions.lock().unwrap().iter() {
        if t_id == &id {
            party.iter().for_each(|(addr, sender)| {
                println!("sending play request to {}", addr);
                let msg = Message::Text("play".to_string());
                sender.unbounded_send(msg).unwrap();
            })
        }
    }

    Ok(())
}
