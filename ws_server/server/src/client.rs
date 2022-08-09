use color_eyre::Result;
use futures_channel::mpsc::UnboundedSender;
use std::net::SocketAddr;
use tokio_tungstenite::tungstenite::Message;

use crate::SessionMap;

pub fn connect_to_host(
    id: u8,
    sessions: SessionMap,
    addr: SocketAddr,
    sender: UnboundedSender<Message>,
) -> Result<()> {
    // create a new stored session;
    sessions
        .lock()
        .unwrap()
        .get_mut(&id)
        .unwrap()
        .insert(addr, sender);

    Ok(())
}
