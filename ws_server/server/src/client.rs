use color_eyre::Result;
use futures_channel::mpsc::UnboundedSender;
use std::net::SocketAddr;
use tokio_tungstenite::tungstenite::Message;

use crate::{SessionMap, UrlMap, requests::HostRequest};

// need a dc func

pub fn connect_to_host(
    id: u8,
    sessions: SessionMap,
    urls: UrlMap,
    addr: SocketAddr,
    sender: UnboundedSender<Message>,
) -> Result<()> {

    let url = urls.lock().unwrap().get(&id).unwrap().clone();
    println!("sending url {}", url);
    let request = HostRequest {
        id: id.to_string(),
        request: "url".to_string(),
        url: Some(url),
        time: None,
    };
    sender.unbounded_send(Message::Text(serde_json::to_string(&request).unwrap()))?;

    // create a new stored session;
    sessions
        .lock()
        .unwrap()
        .get_mut(&id)
        .unwrap()
        .insert(addr, sender);

    Ok(())
}
