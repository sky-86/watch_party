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
