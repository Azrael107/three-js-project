import * as THREE from "three";
THREE.Cache.enabled = true;  // This will enable caching in Three.js
import { World, Body, Sphere, Plane, Vec3 } from "cannon-es";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { usePlayer } from "../hooks/usePlayer";
import { useEffect, useRef } from "react";

export const useInititializeThreeJS = () => {
  //References to store objects that persist across re-renders.
  const sceneRef = useRef<|THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cameraOffsetRef = useRef(new THREE.Vector3(0, 5, 10)); // Offset: Above and behind the player
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const worldRef = useRef<World | null>(null);
  const groundRef = useRef<{mesh: THREE.Mesh, body: Body} | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const lightsRef = useRef<any[]>([]);
  const fallingLightsRef = useRef<any[]>([]);
  const composerRef = useRef<EffectComposer | null>(null);
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const animationFrameIDRef = useRef<number | null>(null);
  const snowfallIntervalIDRef = useRef<NodeJS.Timeout | null>(null);
  const snowfallActiveRef = useRef(false);  // Add state to manage snowing
  const { initPlayer, updatePlayer, playerRef } = usePlayer();

  console.log("I'm here", playerRef);
  const addLuminescentSnow = () => {
    if (snowfallIntervalIDRef.current) return;  // Prevent setting multiple intervals
        snowfallIntervalIDRef.current = setInterval(() => {
          const randomZ = (Math.random() * 30) - 15;
          const randomX = (Math.random() * 30) - 15;
          const rainbowColors = [
            "#FF0000",
            "#FF7F00",
            "#FFFF00",
            "#00FF00",
            "#0000FF",
            "#4B0082",
            "#8B00FF",
          ];
          const randomColor =
            rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
          // Create a Point Light
          const fallingLight = new THREE.PointLight(randomColor, 10, 100); //color, radius, magnitude
          fallingLight.position.set(randomZ, 15, randomX);
    
          const sphereGeometry = new THREE.SphereGeometry(0.1, 10, 16); // radius, width segments, height segments
          const sphereMaterial = new THREE.MeshStandardMaterial({
            color: randomColor,
            emissive: randomColor,
            emissiveIntensity: 5,
          });
          const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
          sphere.castShadow = true;
          sphere.position.copy(fallingLight.position); // Start the sphere at the same position as the light      
          //adding the visual representation to the SCENE!!!
          sceneRef.current?.add(sphere); 
          sceneRef.current?.add(fallingLight);
    
          // Add physics to the light
          const lightBody = new Body({
            mass: 0.00000000000000005, // Dynamic object
            shape: new Sphere(0.5), // Spherical physics shape
            position: new Vec3(randomZ, 20, randomX),
          });
          //adding the physical representation to the WORLD!!!
          worldRef.current?.addBody(lightBody);
          fallingLightsRef.current?.push({ light: fallingLight, sphere, body: lightBody });
        },600);
        console.log("addLuminescentSnow:", "Snow is falling!");
      };//Don't forget to add logic to destroy light fallen after collison.  

      const stopSnow = () => {
        if (snowfallIntervalIDRef.current) {
          clearInterval(snowfallIntervalIDRef.current);
          snowfallIntervalIDRef.current = null;  // Clear the reference
          console.log("Snow stopped");
        }
      };

  useEffect(() => {
    //Create Scene(ORDER NOT INTERCHANGEABLE)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);
    sceneRef.current = scene;

    //Create Camera(ONI)
    const camera = new THREE.PerspectiveCamera(
      75,
      innerWidth / innerHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 10, 30);
    cameraRef.current = camera;

    //Create PhysicsWorld(ONI)
    const world = new World();
    world.gravity.set(0, -9.82, 0); // Gravity pointing downward
    worldRef.current = world;//storing world in a ref

    //Create Renderer(ONI)
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.setSize(innerWidth, innerHeight);
    const container = document.querySelector(`.scene`) || document.body;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer; //storing renderer in a ref

    //The order of the above is not interchangeable because the scene needs to be created before the camera is placed ... and they need to be present for the renderer to know what to wrk with. The rest are unimportant.

    //Create Ground (Cannon-ES)
    const groundGeometry = new THREE.PlaneGeometry(100, 100); //creating the geometrical form(coordinates)
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f8ff }); //creating the material
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial); //merging geometry and material to create tangible object of set dimensions
    groundMesh.rotation.x = -Math.PI / 2; // Make it horizontal
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);
      // Add ground to the physics world (Cannon.js)
    const groundBody = new Body({
      mass: 0, // Static ground
      shape: new Plane(),
      position: new Vec3(0, 0, 0),
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Align with Three.js ground
    world.addBody(groundBody);
    groundRef.current = {mesh: groundMesh, body: groundBody,}; //storing the ground and its physical counterpart in ref

    // Create Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;

     // Add debugging helpers (optional)
     sceneRef.current.add(new THREE.AxesHelper(5));
     cameraRef.current.position.set(0, 5, 10);
     rendererRef.current.setSize(window.innerWidth, window.innerHeight);
     document.body.appendChild(rendererRef.current.domElement);

     initPlayer(worldRef.current, sceneRef.current);
       
    //Create Lights   
    const ambientLight = new THREE.AmbientLight(0x404040, 5); // Color: 0x404040 (soft white), Intensity: 0.2
    sceneRef.current?.add(ambientLight);
    lightsRef.current.push(ambientLight);
  
    /*light = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(light);
        directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);*/
    
            
    //Create Post Processing
    const setupPostProcessing = () => {
      // Render Pass: Render the scene normally
      const renderPass = new RenderPass(sceneRef.current!, cameraRef.current!);  
      // Bloom Pass: Add glow effects
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5, // Strength of bloom
        0.4, // Bloom radius
        0.85, // Threshold
      );
  
      // Composer: Combine passes & store in ref
      composerRef.current= new EffectComposer(rendererRef.current!);
      composerRef.current.addPass(renderPass);
      composerRef.current.addPass(bloomPass);
      //Storing bloompass to save us headache
      bloomPassRef.current = bloomPass;
    };
  
    //Load House Model
    const loadModel = () => {
      // Load the GLTF Model
      const loader = new GLTFLoader();
      loader.load(
        "/assets/House_001_GLB.glb",
        (gltf) => {
          if (!sceneRef.current) {
            console.error("Scene is not initialized.");
            return;
          }
          const model = gltf.scene;
          model.castShadow = true;
          
          sceneRef.current?.add(model);
          modelRef.current = model;
          //console.log("house here!");

          // Animation
          const mixer = new THREE.AnimationMixer(model);
          mixerRef.current = mixer; //...
          gltf.animations.forEach((clip) => {
            mixer.clipAction(clip).play(); // Play all animations in the model
          });
        },
        undefined,
        (error) => {
          console.error("Error loading the model:", error);
        },
      );
    };
    
    const addAnimation = () => {
      const clock = new THREE.Clock();
      let isAnimating = true;
    
      const animate = () => {
        if (!isAnimating) return; // Skip rendering if not animating
        /*if(player && camera) {
          camera.position.set(player.position.x, player.position.y, player.position.z + 10); 
          camera.lookAt(player.position);
        }*/
        //if (!playerRef.current || !cameraRef.current || !cameraOffsetRef.current) return; 

        // Request animation frame
        animationFrameIDRef.current = requestAnimationFrame(animate);
        rendererRef.current?.render(sceneRef.current!, cameraRef.current!);
        //console.log("Rendering...");
    
        const delta = clock.getDelta(); // Get time delta for smooth updates
    
        // Update physics world
        worldRef.current?.step(1 / 60, delta, 3);

        if (playerRef.current) {
          const targetPosition = playerRef.current.position.clone().add(cameraOffsetRef.current);
          cameraRef.current?.position.lerp(targetPosition, 0.1);
          cameraRef.current?.lookAt(playerRef.current.position);
          console.log("Player defined", playerRef.current.position);
        } else {
          console.warn("PlayerRef is null! Camera cannot follow.");
        }
    
        // Update player logic (if any)
        updatePlayer();
        //if(initPlayer) initPlayer();   
    
        // Sync falling lights with their physics bodies
        fallingLightsRef.current?.forEach(({ light, sphere, body }, index) => {
          if (body.position.y < 1) {
            sceneRef.current?.remove(light);
            sceneRef.current?.remove(sphere);
            worldRef.current?.removeBody(body);
            lightsRef.current?.splice(index, 1); // Remove from array
          } else {
            light.position.copy(body.position);
            sphere.position.copy(body.position);
          }
        });
    
        // Update animation mixer
        if (mixerRef.current) {
          mixerRef.current.update(delta);
        }
    
        // Update controls and render
        controlsRef.current?.update();
        composerRef.current?.render();
      };
    
      // Start the animation loop after player arrives.
      const waitForPlayer = setInterval(() => {
        if (playerRef.current) {
          console.log("Player loaded, starting animation.");
          clearInterval(waitForPlayer);
          animate(); // Start animation loop only when player is available
        }
      }, 100);
    
      // Pause/Resume animation on tab visibility change
      const handleVisibilityChange = () => {
        if (document.hidden) {
          //isAnimating = false;
          animate();
        } else {
          isAnimating = true;
          animate();
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);
      // Store cleanup logic for visibility change
      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        if (animationFrameIDRef.current !== null) {
          cancelAnimationFrame(animationFrameIDRef.current);
        }
      };
    };

  const addWindowResizeListener = () => {
    // Handle Window Resize
    addEventListener("resize", () => {
      if(cameraRef.current) {
        cameraRef.current.aspect = innerWidth / innerHeight;
        cameraRef.current?.updateProjectionMatrix();
      }
      if(rendererRef.current) {
        rendererRef.current.setSize(innerWidth, innerHeight);
      }
    });
  };

  loadModel();
  setupPostProcessing();
  addAnimation();
  addWindowResizeListener();
  //return cleanup;
}, [sceneRef.current, cameraRef.current, rendererRef.current, initPlayer]);

  return { scene: sceneRef.current, camera: cameraRef.current, world: worldRef.current, renderer: rendererRef.current, addLuminescentSnow, stopSnow, animationFrameID: animationFrameIDRef.current, snowfallActiveRef};
};
