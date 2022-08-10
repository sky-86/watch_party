use color_eyre::Result;
use dotenv::dotenv;
use std::collections::HashMap;
use std::env;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use tokio::net::TcpListener;
use tokio_tungstenite::tungstenite::Message;

use futures_channel::mpsc::UnboundedSender;

mod client;
mod host;
mod handle_client;

use crate::handle_client::{handle_client, VideoState};

//pub type PeerMap = Arc<Mutex<HashMap<SocketAddr, Tx>>>;
pub type Tx = UnboundedSender<Message>;
pub type SessionMap = Arc<Mutex<HashMap<u8, HashMap<SocketAddr, Tx>>>>;
pub type HostMap = Arc<Mutex<HashMap<SocketAddr, u8>>>;
pub type StateMap = Arc<Mutex<HashMap<u8, VideoState>>>;

#[tokio::main]
async fn main() -> Result<()> {
    color_eyre::install()?;
    dotenv().ok();

    // holds the number of current hosts
    let session_map = SessionMap::new(Mutex::new(HashMap::new()));
    let host_map = HostMap::new(Mutex::new(HashMap::new()));
    let state_map = StateMap::new(Mutex::new(HashMap::new()));

    let address = env::var("ADDRESS").unwrap();
    let port = env::var("PORT").unwrap();
    let curr_addr = format!("{}:{}", address, port);

    let listener = TcpListener::bind(&curr_addr).await?;
    println!("Listening on {}", &curr_addr);

    while let Ok((stream, addr)) = listener.accept().await {
        tokio::spawn(handle_client(session_map.clone(), host_map.clone(), state_map.clone(), stream, addr));
    }

    Ok(())
}
