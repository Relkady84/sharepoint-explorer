import axios from "axios";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export function createGraphClient(token: string) {
  return axios.create({
    baseURL: GRAPH_BASE,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}
