async fn _handle_client_old(peer_map: PeerMap, raw_stream: TcpStream, addr: SocketAddr) -> Result<()> {
    let ws_stream = tokio_tungstenite::accept_async(raw_stream).await?;
    println!("Websocket connection established {}", addr);

    let (sender, reciever) = unbounded();
    peer_map.lock().unwrap().insert(addr, sender);

    let (outgoing, incoming) = ws_stream.split();

    let broadcast_incoming = incoming.try_for_each(|msg| {
        println!("Recieved msg from {}: {}", addr, msg.to_text().unwrap());
        let peers = peer_map.lock().unwrap();

        let broadcast_recipients = peers.iter()
            //.filter(|(peer_addr, _)| peer_addr != &&addr)
            .map(|(_, ws_sink)| ws_sink);

        for recp in broadcast_recipients {
            recp.unbounded_send(msg.clone()).unwrap();
        }

        future::ok(())
    });

    let recieve_from_others = reciever.map(Ok).forward(outgoing);

    pin_mut!(broadcast_incoming, recieve_from_others);
    future::select(broadcast_incoming, recieve_from_others).await;

    println!("{} dc", &addr);

    peer_map.lock().unwrap().remove(&addr);
    Ok(())
}
