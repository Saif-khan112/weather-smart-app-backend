const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const API_KEY = "f0da324c079ee8eded9dbcffc3f4c6f8";

// Helper to get lat/lon/timezone by ZIP
async function getLocationData(zip: string) {
  const res = await axios.get(
    `http://api.openweathermap.org/geo/1.0/zip?zip=${zip}&appid=${API_KEY}`
  );
  const { lat, lon, name } = res.data;

  const timezoneRes = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`
  );

  return {
    latitude: lat,
    longitude: lon,
    timezone: timezoneRes.data.timezone,
  };
}

// Create User
import { Request, Response } from "express";
import { db } from "./firebase";

app.post("/users", async (req: Request, res: Response) => {
  try {
    const { name, zip } = req.body;
    const id = Date.now().toString(); // unique ID
    const location = await getLocationData(zip);

    const user = { id, name, zip, ...location };
    await db.ref(`users/${id}`).set(user);
    res.status(201).json(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// Read All Users
app.get("/users", async (req: Request, res: Response) => {
  const snapshot = await db.ref("users").once("value");
  const data = snapshot.val();
  res.json(data || {});
});

// Read Single User
app.get("/users/:id", async (req: Request, res: Response) => {
  const snapshot = await db.ref(`users/${req.params.id}`).once("value");
  res.json(snapshot.val());
});

// Update User
app.put("/users/:id", async (req: Request, res: Response) => {
  try {
    const { name, zip } = req.body ;
    const userRef = db.ref(`users/${req.params.id}`);
    const snapshot = await userRef.once("value");

    if (!snapshot.exists()) return res.status(404).send("User not found");

    const oldData = snapshot.val();
    let updatedData = { name, zip };

    if (zip !== oldData.zip) {
      const location = await getLocationData(zip);
      updatedData = { ...updatedData, ...location };
    } else {
      updatedData = { ...oldData, name };
    }

    await userRef.set({ id: req.params.id, ...updatedData });
    res.json({ id: req.params.id, ...updatedData });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// Delete User
app.delete("/users/:id", async (req: Request, res: Response) => {
  await db.ref(`users/${req.params.id}`).remove();
  res.send("User deleted");
});

// Test route
app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the SMART interview!");
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
