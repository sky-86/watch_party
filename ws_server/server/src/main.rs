use color_eyre::Result;
use dotenv::dotenv;
use std::collections::HashMap;
use std::env;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use tokio::net::TcpListener;
use tokio_tungstenite::tungstenite::Message;

use futures_channel::mpsc::UnboundedSender;

mod handle_client;
mod requests;
mod client;
mod host;

use crate::handle_client::handle_client;

pub type Tx = UnboundedSender<Message>;
// bind the host id to a group of guests
pub type SessionMap = Arc<Mutex<HashMap<u8, HashMap<SocketAddr, Tx>>>>;
pub type UrlMap = Arc<Mutex<HashMap<u8, String>>>;

#[tokio::main]
async fn main() -> Result<()> {
    color_eyre::install()?;
    dotenv().ok();

    let session_map = SessionMap::new(Mutex::new(HashMap::new()));
    let url_map = UrlMap::new(Mutex::new(HashMap::new()));

    let address = env::var("ADDRESS").unwrap();
    let port = env::var("PORT").unwrap();
    let curr_addr = format!("{}:{}", address, port);

    let listener = TcpListener::bind(&curr_addr).await?;
    println!("Listening on {}", &curr_addr);

    while let Ok((stream, addr)) = listener.accept().await {
        tokio::spawn(handle_client(
            session_map.clone(),
            url_map.clone(),
            stream,
            addr,
        ));
    }

    Ok(())
}
