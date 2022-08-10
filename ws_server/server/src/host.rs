use color_eyre::Result;
use futures_channel::mpsc::UnboundedSender;
use rand::prelude::*;
use std::collections::HashMap;
use std::net::SocketAddr;
use tokio_tungstenite::tungstenite::Message;

use crate::handle_client::VideoState;
use crate::{HostMap, SessionMap, StateMap};

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

fn find_host(hosts: HostMap, curr_addr: &SocketAddr) -> u8 {
    // find the party id of the host
    hosts
        .lock()
        .unwrap()
        .iter()
        .filter(|(addr, _id)| addr == &curr_addr)
        .map(|(_addr, id)| *id)
        .next()
        .unwrap()
}

pub fn send_request(
    request: String,
    sessions: SessionMap,
    hosts: HostMap,
    curr_addr: &SocketAddr,
) -> Result<()> {
    let id = find_host(hosts, curr_addr);
    println!("{}", id);
    // find the associated session
    for (t_id, party) in sessions.lock().unwrap().iter() {
        if t_id == &id {
            party.iter().for_each(|(addr, sender)| {
                println!("sending request: {} to {}", &request, addr);
                let msg = Message::Text(request.clone());
                sender.unbounded_send(msg).unwrap();
            })
        }
    }

    Ok(())
}

pub fn update_guest_state(
    id: u8,
    state_map: StateMap,
    sessions: SessionMap,
    curr_addr: &SocketAddr,
) -> Result<()> {
    let state = state_map
        .lock()
        .unwrap()
        .iter()
        .filter(|(t_id, _curr_state)| t_id == &&id)
        .map(|(_t_id, curr_state)| curr_state.clone())
        .next()
        .unwrap();

    // find the associated session
    for (t_id, party) in sessions.lock().unwrap().iter() {
        if t_id == &id {
            party.iter().for_each(|(addr, sender)| {
                let msg = Message::Text(serde_json::to_string(&state).unwrap());
                sender.unbounded_send(msg).unwrap();
            })
        }
    }

    Ok(())
}

pub fn save_state(
    state_map: StateMap,
    new_state: VideoState,
    hosts: HostMap,
    curr_addr: &SocketAddr,
) -> Result<()> {
    let id = find_host(hosts, curr_addr);
    println!("{}", id);

    state_map
        .lock()
        .unwrap()
        .insert(id, new_state);

    Ok(())
}
