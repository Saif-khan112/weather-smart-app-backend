require('dotenv').config();
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Create User
import { Request, Response } from "express";
import { db } from "./firebase";
import { getLocationData } from "./utils/function";

app.post("/users", async (req: Request, res: Response) => {
  try {
    const { name, zip } = req.body;
    if (!name || !zip) {
      return res.status(400).json({ error: "Name and zip are required." });
    }    
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
  try {
    const snapshot = await db.ref("users").once("value");
    const data = snapshot.val();

    // Convert object to array of user objects
    const users = data ? Object.values(data) : [];

    res.status(200).json(users);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});


// Read Single User
app.get("/users/:id", async (req: Request, res: Response) => {
  const snapshot = await db.ref(`users/${req.params.id}`).once("value");
  res.json(snapshot.val());
});

// Update User
app.put("/users/:id", async (req: Request, res: Response) => {
  try {
    const { name, zip } = req.body;
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
  const userRef = db.ref(`users/${req.params.id}`);
  const snapshot = await userRef.once("value");

  if (!snapshot.exists()) return res.status(404).send("User not found");
  await db.ref(`users/${req.params.id}`).remove();
  res.send("User deleted");
});

// Test route
app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the SMART interview!");
});

app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
