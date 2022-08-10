use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct EstablishClient {
    pub client: String,
    pub id: Option<String>,
    pub url: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct HostRequest {
    pub id: String,
    pub request: String,
    pub time: Option<i32>,
    pub url: Option<String>,
}
