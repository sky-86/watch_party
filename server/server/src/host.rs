use color_eyre::Result;
use futures_channel::mpsc::UnboundedSender;
use rand::prelude::*;
use std::collections::HashMap;
use std::net::SocketAddr;
use tokio_tungstenite::tungstenite::Message;

use crate::{SessionMap, UrlMap};
use crate::requests::HostRequest;

pub fn new_host(
    url: String,
    sessions: SessionMap,
    urls: UrlMap,
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

    urls
        .lock()
        .unwrap()
        .insert(id, url);

    Ok(())
}

pub fn send_request(
    request: HostRequest,
    sessions: SessionMap,
    urls: UrlMap,
) -> Result<()> {
    let id = &request.id;
    let id = id.parse::<u8>().unwrap();
    // find the associated session
    for (host_id, party) in sessions.lock().unwrap().iter() {
        if host_id == &id {
            party.iter().for_each(|(addr, sender)| {
                println!("sending request: {:?} to {}", &request, addr);
                let msg = Message::Text(serde_json::to_string(&request).unwrap());
                sender.unbounded_send(msg).unwrap();
            })
        }
    }

    Ok(())
}
