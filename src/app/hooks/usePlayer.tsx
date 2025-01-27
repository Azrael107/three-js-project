import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Body, Sphere, Vec3 } from "cannon-es";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export const usePlayer = (world: any, scene: any) => {
  const playerRef = useRef<THREE.Group | null>(null); // Reference to the player model (Group is used to handle multiple meshes in GLB)
  const playerBodyRef = useRef<Body | null>(null); // Reference to the physics body
  const loader = new GLTFLoader(); // GLTF loader

  // Load the player model from the GLB file
  useEffect(() => {
    if (!world || !scene) {
      console.warn("World or Scene is not yet initialized.");
      return;
    }
    loader.load(
      "/assets/PlayerModel.glb", // Path to your GLB file
      (gltf) => {
        const model = gltf.scene;
        scene.add(model); // Add the model to the scene
        console.log("model added to scene succesfully");
        playerRef.current = model;
        model.position.set(10,5,10);
        model.visible = true;
        console.log("Player model added to scene:", model.position);

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;  // Enable casting shadows
            child.receiveShadow = true;  // Enable receiving shadows
          }
        });

        // Create a physics body for the player
        const playerBody = new Body({
          mass: 1, // Dynamic object
          position: new Vec3(10, 5, 10),
          shape: new Sphere(1), // Default shape, assuming the model is roughly spherical
        });

        // Add the player body to the physics world
        world.addBody(playerBody);
        playerBodyRef.current = playerBody;
      },
      undefined,
      (error) => {
        console.error("Error loading the GLB model:", error);
      }
    );

    return () => {
      // Cleanup when the component unmounts
      if (playerRef.current) {
        scene.remove(playerRef.current);
      }
      if (playerBodyRef.current) {
        world.removeBody(playerBodyRef.current);
      }
    };
  }, [world, scene, loader]);

  // Update the player position
  const updatePlayer = () => {
    if (playerRef.current && playerBodyRef.current) {
      const { x, y, z } = playerBodyRef.current.position;
      playerRef.current.position.set(x, y, z);
    }
  };

  return { updatePlayer }; 
};
