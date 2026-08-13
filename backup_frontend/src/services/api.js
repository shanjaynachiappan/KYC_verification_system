import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000", // change later if needed
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;