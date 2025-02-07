import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { World, Body, Sphere, Vec3 } from "cannon-es";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTF } from "three/examples/jsm/Addons.js";

export const usePlayer = () => {
  const playerRef = useRef<THREE.Group | null>(null); // Reference to the player model (Group is used to handle multiple meshes in GLB)
  const playerBodyRef = useRef<Body | null>(null); // Reference to the physics body
  const loader = new GLTFLoader(); // GLTF loader
  const sceneRef = useRef<THREE.Scene | null>(null);
  const worldRef = useRef<World | null>(null);


  // Load the player model from the GLB file
  useEffect(() => {
    return () => {
      console.log("WE R HERE!")
      // Cleanup when the component unmounts
      if (playerRef.current) {
        //scene.remove(playerRef.current);
      }
      if (playerBodyRef.current) {
        //world.removeBody(playerBodyRef.current);
      }
    };
  }, []);

  const initPlayer = (world: World, scene: THREE.Scene) => {
   sceneRef.current = scene;
   worldRef.current = world;
   //setWorld(world);
    if (!worldRef.current || !sceneRef.current) {
      console.warn("World or Scene is not yet initialized.");
      return;
    }
    console.log("Went through here!")

    loader.load(
      "/assets/PlayerModel.glb", // Path to your GLB file
      (gltf: GLTF) => {
        const model = gltf.scene;
        sceneRef.current?.add(model); // Add the model to the scene
        console.log("model added to scene succesfully");
        playerRef.current = model;
        model.position.set(15,5,15);
        model.visible = true;
        console.log("Player model added to scene:", model.position);

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });     

        // Create a physics body for the player
        const playerBody = new Body({
          mass: 1, // Dynamic object
          position: new Vec3(10, 5, 10),
          shape: new Sphere(1), // Default shape, assuming the model is roughly spherical
        });

        // Add the player body to the physics world
        worldRef.current?.addBody(playerBody);
        playerBodyRef.current = playerBody;
      },
      undefined,
      (error: unknown) => {
        if (error instanceof Error) {  //Check if error is actually an Error object
            console.error("Error loading the GLB model:", error.message);
        } else {  //If it's not an Error, we handle it differently
            console.error("An unknown error occurred:", error);
        }
    }
    
    );    
  }

  // Update the player position
  const updatePlayer = () => {
    if (playerRef.current && playerBodyRef.current) {
      const { x, y, z } = playerBodyRef.current.position;
      playerRef.current.position.set(x, y, z);
    }
  };

  return { updatePlayer, initPlayer, playerRef}; 
};
