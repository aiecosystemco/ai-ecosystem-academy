import type { Chapter, ContentBlock } from "@/lib/book-public";

export type { Chapter, ContentBlock };

export const chapters: Chapter[] = [
  {
    id: 0,
    slug: "about",
    title: "About this book",
    subtitle: "How to study, not just read",
    minutes: 8,
    blocks: [
      {
        kind: "p",
        text: "This book is a practical learning companion for the AI Ecosystem Academy. It follows the same simple progression used in the class materials: understand the concept, see a practical example, follow the steps, test the result, fix what goes wrong, and complete an assignment.",
      },
      {
        kind: "p",
        text: "AI tools change quickly. Menus, free tiers, model names and available features may change over time. Use the workflow and creative principles in this book as your foundation, then verify the current interface and capabilities of the tool you are using.",
      },
      {
        kind: "p",
        text: "The examples are designed to be recreated. Do not only read the prompts. Copy them, test them, compare the output, identify problems, improve the prompt, and repeat.",
      },
      {
        kind: "rule",
        title: "The core rule",
        text: "A professional AI video is not usually one long generation. Build short, carefully planned pieces, then edit them into one finished story.",
      },
      {
        kind: "h",
        text: "How to use this academy",
      },
      {
        kind: "p",
        text: "Read each chapter in order the first time. After that, return to any chapter as a studio reference. Every working prompt in the book also lives in the Prompt library. The Studio is where you build your own character bible, assemble the eight-part formula, and send work to the author for rating.",
      },
      {
        kind: "list",
        title: "The study loop",
        items: [
          "Read the teaching until you can explain it in one sentence.",
          "Copy the example prompt exactly and generate it.",
          "Write down what failed: hands, eyes, wardrobe, motion, camera, lighting.",
          "Change one variable. Generate again. Compare.",
          "Save the version that works in your notebook.",
          "Complete the assignment and submit your prompt work in Studio when you want it rated.",
        ],
      },
      {
        kind: "p",
        text: "A shared link cannot open this book. Your unique access code is your licence. Do not post the code on social media. If a code is forwarded, the author can revoke it and the reader must pay for their own access.",
      },
      {
        kind: "rule",
        title: "Workbook, not wallpaper",
        text: "Recreate the examples. Build your prompt library. Save your failures. Improve one variable at a time. Then build systems around what works.",
      },
    ],
  },
  {
    id: 1,
    slug: "complete-workflow",
    title: "The complete AI content creation workflow",
    subtitle: "From your first idea to a finished short video",
    minutes: 22,
    blocks: [
      {
        kind: "learn",
        items: [
          "Develop a simple content idea.",
          "Turn an idea into a short script.",
          "Break the story into scenes and shots.",
          "Create a consistent character.",
          "Generate and animate images.",
          "Add voice, music, captions and branding.",
          "Export a finished social-media video.",
        ],
      },
      {
        kind: "p",
        text: "AI can help one creator perform work that once required a much larger production team. But the advantage does not come from simply knowing where the generate button is. It comes from knowing what to do before and after generation. The workflow in this chapter gives you that foundation.",
      },
      {
        kind: "h",
        text: "The complete pipeline",
      },
      {
        kind: "pipeline",
        items: [
          "Idea",
          "Script",
          "Storyboard",
          "Character",
          "Image",
          "Video",
          "Voice",
          "Edit",
          "Sound",
          "Branding",
          "Export",
        ],
      },
      {
        kind: "p",
        text: "Treat each stage as a gate. Do not animate until the still image is right. Do not edit until the clips serve the script. Do not add music until the voice is clear. Skipping a gate is how AI videos become noisy instead of cinematic.",
      },
      {
        kind: "h",
        text: "Practical project — Greg, the dog who found his strength",
      },
      {
        kind: "p",
        text: "Greg is a young German Shepherd who lacks confidence, trains consistently, and finally learns that real strength can begin with self-belief. This one story will teach you idea, script, shots, character, image, motion, voice, edit, sound, branding and export.",
      },
      {
        kind: "rule",
        title: "Story spine",
        text: "Hook: Greg is the smallest dog on the street. Problem: he watches others play and does not believe he belongs. Change: he trains every day, quietly. Ending: he walks the same street with his head up. Strength started as self-belief.",
      },
      {
        kind: "h",
        text: "Sample narration — about 45 seconds",
      },
      {
        kind: "p",
        text: "Greg was the smallest dog on the street. Every morning the others ran, jumped and played. Greg watched. He wanted to try. So he trained. Quietly. Every day. Until the morning he walked that same street with his head up. Strength did not start in his legs. It started when he believed he belonged.",
      },
      {
        kind: "p",
        text: "Read it out loud. If you run out of breath, the sentence is too long for short-form. Short sentences give the editor places to cut.",
      },
      {
        kind: "h",
        text: "Twelve production steps",
      },
      {
        kind: "steps",
        items: [
          {
            title: "Choose the story idea",
            body: "Start with a simple story containing a hook, a problem, a change and an ending. If you cannot say those four beats in one breath, the idea is not ready.",
          },
          {
            title: "Write the script",
            body: "Keep the narration short enough for the target platform. A 30–60 second story is an excellent beginner exercise. Write for the ear, not the page.",
          },
          {
            title: "Break the story into shots",
            body: "Plan one visual purpose per shot instead of trying to generate the entire story at once. A shot is not a scene. A shot is one camera idea.",
          },
          {
            title: "Create the character",
            body: "Build a reference image and define face, body, clothing, personality and visual style. Greg’s identity must survive every frame.",
          },
          {
            title: "Generate the story images",
            body: "Create one keyframe or strong image for each shot. Fix identity, wardrobe and environment in the still before you animate.",
          },
          {
            title: "Animate the images",
            body: "Turn each keyframe into a short video clip, usually around 4–6 seconds for short-form practice. One main action per clip.",
          },
          {
            title: "Create the voice-over",
            body: "Record your voice or use a suitable AI voice. Match age, personality, tone and story style. Leave space for silence.",
          },
          {
            title: "Edit in CapCut",
            body: "Arrange the clips, align the narration, and build the story in the timeline. Story first. Decoration later.",
          },
          {
            title: "Add captions",
            body: "Generate automatic captions, correct them, and keep them inside the safe viewing area so platform UI does not cover the words.",
          },
          {
            title: "Add sound effects",
            body: "Use ambience and effects to make actions feel real: street air, paws on concrete, distant dogs, a breeze in fur.",
          },
          {
            title: "Add music",
            body: "Choose music that supports the emotional direction without overpowering the narration. Soft at the watch. Lift at the belief.",
          },
          {
            title: "Add branding and export",
            body: "Add your name, logo or social handle, then export in the correct platform format. For vertical short-form: 1080 × 1920, 9:16.",
          },
        ],
      },
      {
        kind: "h",
        text: "Greg shot list — eight shots, one purpose each",
      },
      {
        kind: "list",
        items: [
          "Shot 1 — Hook: Greg walks the neighborhood with his head slightly lowered. Audience meets him.",
          "Shot 2 — Problem: other dogs play in the distance. Greg watches. Desire is visible.",
          "Shot 3 — Decision: close-up of Greg’s eyes. He turns toward training.",
          "Shot 4 — Training: Greg runs a short stretch, slightly awkward, committed.",
          "Shot 5 — Struggle: he slows, breathes, almost stops. The change is not easy.",
          "Shot 6 — Persistence: he starts again. Small, clean action.",
          "Shot 7 — Breakthrough: same street as shot 1, head up, ears forward, light warmer.",
          "Shot 8 — Ending: Greg stands with the other dogs. Belonging, not dominance.",
        ],
      },
      {
        kind: "h",
        text: "Character reference — lock this before any other Greg image",
      },
      {
        kind: "prompt",
        title: "Greg — character reference",
        text: "Greg, a highly realistic young male German Shepherd dog with authentic German Shepherd facial structure, naturally slim body, black and tan fur, intelligent brown eyes, large upright ears, realistic fur texture, authentic canine anatomy and proportions, emotionally expressive eyes, slightly insecure body language, modern urban dog neighborhood, cinematic storytelling, photorealistic, highly detailed, dramatic natural lighting, vertical 9:16.",
      },
      {
        kind: "p",
        text: "Generate this reference until the face, ears, fur pattern and body feel like one specific dog. Save the strongest frame. Reuse it as the identity lock for every later Greg shot.",
      },
      {
        kind: "h",
        text: "Keyframe prompts — still images before motion",
      },
      {
        kind: "prompt",
        title: "Greg — shot 1 still, head lowered",
        text: "Greg the young German Shepherd from the reference, walking slowly down a modern urban dog neighborhood street, head slightly lowered, slim black and tan body, large upright ears, realistic fur, slightly insecure body language, other dogs softly out of focus in the distance, cinematic storytelling, photorealistic, dramatic natural lighting, vertical 9:16.",
      },
      {
        kind: "prompt",
        title: "Greg — shot 2 still, watching the others",
        text: "Greg the young German Shepherd from the reference, sitting at the edge of a neighborhood play area, watching other dogs run and jump in the background, intelligent brown eyes focused forward, slim body, black and tan fur, quiet longing expression, photorealistic cinematic frame, natural daylight, vertical 9:16.",
      },
      {
        kind: "prompt",
        title: "Greg — shot 7 still, head up",
        text: "Greg the young German Shepherd from the reference, walking the same modern urban neighborhood street with his head up, ears forward, confident but gentle body language, slim black and tan coat catching warm morning light, photorealistic, cinematic storytelling, highly detailed, vertical 9:16.",
      },
      {
        kind: "h",
        text: "Motion prompts — one action per clip",
      },
      {
        kind: "prompt",
        title: "Greg — video motion, the walk",
        text: "Greg slowly walks down the neighborhood street with his head slightly lowered. His ears move naturally and his fur responds gently to the breeze. Other dogs move naturally in the distant background. Slow cinematic tracking shot moving beside Greg, emotional atmosphere, realistic canine movement.",
      },
      {
        kind: "prompt",
        title: "Greg — video motion, the watch",
        text: "Greg sits still at first, then his ears tilt toward the playing dogs. He breathes, blinks, and shifts his weight slightly forward as if he wants to join. Subtle realistic canine micro-movement, static camera, emotional quiet, photorealistic.",
      },
      {
        kind: "prompt",
        title: "Greg — video motion, the return",
        text: "Greg walks toward camera with his head up, ears forward, tail moving naturally. Warm morning light, slow cinematic push-in, realistic canine gait, confident but gentle energy, same neighborhood street.",
      },
      {
        kind: "rule",
        title: "The golden rule",
        text: "Short image → short AI video clip → edit everything together. This gives you more control, easier corrections, better storytelling and better consistency.",
      },
      {
        kind: "p",
        text: "If you ask one generation to tell the entire Greg story, the model will invent extra actions, break anatomy, and lose identity. Eight short clips, edited, will always beat one long lucky render.",
      },
      {
        kind: "assignment",
        text: "Create a 30–60 second story using at least six shots. Submit the story idea, script, shot list, character reference, images, video clips, voice-over, edited video and final export. Build the character bible and your best prompt in Studio and send them to the author for rating.",
      },
    ],
  },
  {
    id: 2,
    slug: "niche-system",
    title: "Finding your niche and building your AI content system",
    subtitle: "Test → compare → choose → create → troubleshoot → repeat",
    minutes: 16,
    blocks: [
      {
        kind: "learn",
        items: [
          "Choose a niche that you can create in repeatedly.",
          "Compare image generators using the same prompt.",
          "Compare video generators using the same image and motion prompt.",
          "Identify common image and video failures.",
          "Create interactive content that invites participation.",
        ],
      },
      {
        kind: "p",
        text: "A niche gives your creativity direction. Instead of saying “I make AI content,” define what you want to be known for: cinematic films, history explainers, business ads, sports stories, education, travel, finance or another area you can consistently serve.",
      },
      {
        kind: "h",
        text: "Step 1 — Choose your niche",
      },
      {
        kind: "p",
        text: "Write one sentence: “I create [type of content] for [audience] using AI.” Then list three content ideas you could publish every week. If you cannot list three weekly ideas, the niche is too vague or too thin.",
      },
      {
        kind: "list",
        title: "Sentence examples",
        items: [
          "I create cinematic short films for young African audiences using AI.",
          "I create product ads for Nigerian small brands using AI.",
          "I create history explainers for secondary-school students using AI.",
          "I create sports stories for football fans using AI.",
          "I create travel films for people who want to see African cities using AI.",
        ],
      },
      {
        kind: "h",
        text: "Image generator test — same prompt, several tools",
      },
      {
        kind: "prompt",
        title: "Image generator test",
        text: "A cinematic African king standing on a mountain during sunrise, ultra realistic, 9:16, dramatic lighting.",
      },
      {
        kind: "p",
        text: "Test the same prompt across several image generators. Do not rewrite it between tools. The test is unfair if the prompt changes. Score each output from 1 to 5 for quality, prompt accuracy, realism, lighting, character consistency, text handling, speed and ease of use.",
      },
      {
        kind: "list",
        title: "Scoring sheet",
        items: [
          "Quality — is the image usable in a finished video, or only interesting?",
          "Prompt accuracy — did it actually place a king on a mountain at sunrise?",
          "Realism — skin, fabric, stone, sky, light.",
          "Lighting — is the sunrise motivated, or generic studio glow?",
          "Character consistency — if you generate twice, is it still the same king?",
          "Text handling — if the tool adds letters, are they clean or broken?",
          "Speed and ease — can you actually work this way every week?",
        ],
      },
      {
        kind: "h",
        text: "Video generator test — same image, same motion",
      },
      {
        kind: "prompt",
        title: "Video generator test image",
        text: "A young entrepreneur working in a modern office.",
      },
      {
        kind: "prompt",
        title: "Video motion prompt",
        text: "The entrepreneur walks toward the camera, smiling confidently while sunlight shines through the office windows. Cinematic camera movement.",
      },
      {
        kind: "p",
        text: "Compare motion quality, facial consistency, lip movement, camera movement, realism, rendering speed and prompt accuracy. The winner is the tool that obeys the shot, not the tool with the most dramatic accidents.",
      },
      {
        kind: "rule",
        title: "The tool rule",
        text: "Do not ask “Which AI tool is the best?” Ask “Which tool is best for the job I am doing?”",
      },
      {
        kind: "h",
        text: "Common problems and fixes",
      },
      {
        kind: "list",
        items: [
          "Hands: specify natural hands, realistic fingers, anatomically correct.",
          "Eyes: specify symmetrical eyes and a clear gaze direction.",
          "Faces: use a reference image, consistent descriptions, and seed controls when available.",
          "Clothing: repeat important wardrobe details in every prompt.",
          "Backgrounds: describe the environment specifically and keep it stable.",
          "Video motion: simplify the action and avoid too many movements in one shot.",
          "Camera: use one clear camera movement per shot, such as a slow push-in, pan left or crane up.",
          "Objects: mention important props every time they matter to the story.",
        ],
      },
      {
        kind: "h",
        text: "Make the content interactive",
      },
      {
        kind: "p",
        text: "AI content grows when the audience can participate. Build a version of your film that asks for a response, then publish that version as well as the linear cut.",
      },
      {
        kind: "list",
        items: [
          "Ask: “What would you do?”",
          "Poll: “Which ending do you prefer?”",
          "Guessing game: “Can you guess what happens next?”",
          "Story choice: “Should the hero open the door? YES or NO”",
          "Before-and-after reveal: show the before, pause, then reveal the result.",
          "Tool challenge: show two outputs and ask which tool created which result.",
        ],
      },
      {
        kind: "assignment",
        text: "Choose one niche. Compare at least three image generators and three video generators. Create one 30–60 second video, document three image challenges and three video challenges, and publish one interactive version. Submit your niche sentence and your winning test prompt in Studio.",
      },
    ],
  },
  {
    id: 3,
    slug: "image-generators",
    title: "Choosing and using AI image generators",
    subtitle: "Your image is the foundation of your visual content",
    minutes: 14,
    blocks: [
      {
        kind: "learn",
        items: [
          "Test image tools fairly.",
          "Match tools to your niche.",
          "Improve prompts through controlled iteration.",
          "Create reusable image prompts.",
        ],
      },
      {
        kind: "p",
        text: "An image generator is not simply a button that makes pictures. It is a creative environment. The same prompt can produce different lighting, realism, composition and character stability across tools. Your job is to test rather than guess.",
      },
      {
        kind: "h",
        text: "Fair test — five steps",
      },
      {
        kind: "steps",
        items: [
          { title: "Write one test prompt", body: "Make it specific enough to evaluate the tool. Include subject, place, time, light, style and format." },
          { title: "Run the same prompt everywhere", body: "Do not rewrite it between tools. If you improve the prompt, start a new test round." },
          { title: "Score the output", body: "Use a simple 1–5 score for quality, accuracy, realism, consistency and speed." },
          { title: "Identify the best tool", body: "Choose the one that fits the actual content you plan to make, not the one with the most dramatic demo." },
          { title: "Save successful prompts", body: "Keep the exact wording of prompts that produce useful results. Exact wording is an asset." },
        ],
      },
      {
        kind: "prompt",
        title: "Test prompt — Lagos entrepreneur",
        text: "A cinematic Nigerian entrepreneur standing outside a modern Lagos office at sunrise, realistic skin texture, elegant wardrobe, dramatic natural lighting, cinematic depth of field, photorealistic, vertical 9:16.",
      },
      {
        kind: "rule",
        title: "Prompt improvement",
        text: "Change one thing at a time. If the background is wrong, fix the background. If the wardrobe is wrong, fix the wardrobe. This makes troubleshooting much faster.",
      },
      {
        kind: "h",
        text: "Controlled iteration — one failure, one fix",
      },
      {
        kind: "p",
        text: "Suppose the first generate places the entrepreneur correctly but the wardrobe is too casual. Do not rewrite the whole prompt. Add the wardrobe. Keep everything else.",
      },
      {
        kind: "prompt",
        title: "Iteration — lock the wardrobe",
        text: "A cinematic Nigerian entrepreneur standing outside a modern Lagos office at sunrise, realistic skin texture, wearing a tailored navy suit, white shirt, no tie, clean black leather shoes, elegant wardrobe, dramatic natural lighting, cinematic depth of field, photorealistic, vertical 9:16.",
      },
      {
        kind: "p",
        text: "If the office now looks like a generic glass tower, name the architecture. If the sunrise is too orange, name the light: “low warm sunlight from camera left, long shadows on the pavement.” One change. One test.",
      },
      {
        kind: "h",
        text: "Practical — same person, four places",
      },
      {
        kind: "p",
        text: "Generate the same entrepreneur in a street, office, restaurant and car. Keep identity and wardrobe as consistent as possible. Record which tool gives you the most reliable results.",
      },
      {
        kind: "prompt",
        title: "Same entrepreneur — busy Lagos street",
        text: "The same Nigerian entrepreneur from the reference, standing on a busy Lagos street at sunrise, tailored navy suit, white shirt, realistic skin texture, natural pedestrians softly out of focus, dramatic natural lighting, photorealistic cinematic portrait, vertical 9:16.",
      },
      {
        kind: "prompt",
        title: "Same entrepreneur — office interior",
        text: "The same Nigerian entrepreneur from the reference, standing inside a modern Lagos office, tailored navy suit, white shirt, realistic skin texture, large windows, warm sunrise spilling across the floor, cinematic depth of field, photorealistic, vertical 9:16.",
      },
      {
        kind: "prompt",
        title: "Same entrepreneur — restaurant",
        text: "The same Nigerian entrepreneur from the reference, seated in a refined Lagos restaurant, tailored navy suit, white shirt, realistic skin texture, soft practical lamps, shallow depth of field, photorealistic cinematic frame, vertical 9:16.",
      },
      {
        kind: "prompt",
        title: "Same entrepreneur — car interior",
        text: "The same Nigerian entrepreneur from the reference, sitting in the back seat of a premium car, tailored navy suit, white shirt, realistic skin texture, city light through the window, quiet confidence, photorealistic cinematic close-up, vertical 9:16.",
      },
      {
        kind: "assignment",
        text: "Create five useful images for your niche and save the final prompts in your personal prompt library. Submit your strongest prompt in Studio for rating.",
      },
    ],
  },
  {
    id: 4,
    slug: "video-generators",
    title: "Choosing and using AI video generators",
    subtitle: "Turn still images into controlled movement",
    minutes: 14,
    blocks: [
      {
        kind: "learn",
        items: [
          "Understand image-to-video thinking.",
          "Write simple motion prompts.",
          "Control action and camera separately.",
          "Compare video outputs objectively.",
        ],
      },
      {
        kind: "p",
        text: "AI video becomes easier when you stop thinking about a “movie” and start thinking about a shot. A shot has a subject, an action, a camera direction, an environment and a duration.",
      },
      {
        kind: "list",
        title: "The five parts of a shot",
        items: [
          "Subject — who or what is on screen.",
          "Action — the one thing they do.",
          "Camera — static, push-in, pan, tilt, track or crane.",
          "Environment — what the world is doing around them.",
          "Duration — usually 4–6 seconds for short-form practice.",
        ],
      },
      {
        kind: "h",
        text: "Simple motion — walk, light, camera",
      },
      {
        kind: "prompt",
        title: "Simple motion prompt",
        text: "The entrepreneur slowly walks toward the camera while maintaining eye contact. Warm sunlight passes through the windows. Slow camera push-in, natural body movement, realistic background motion.",
      },
      {
        kind: "rule",
        title: "One shot, one main action",
        text: "If you ask a model to walk, turn, wave, sit, pick up a phone and run in one short shot, you increase the chance of motion errors. Break complex action into multiple shots.",
      },
      {
        kind: "h",
        text: "Camera practice — three versions of one scene",
      },
      {
        kind: "p",
        text: "Create three versions of the same scene: static camera, slow push-in, and lateral tracking. Compare which one best supports the story. The camera is a sentence. Do not shout every sentence.",
      },
      {
        kind: "prompt",
        title: "Version A — static camera",
        text: "The entrepreneur stands in the office and slowly smiles toward camera. Warm sunlight through the windows. Static camera, natural micro-movement, realistic background motion, photorealistic.",
      },
      {
        kind: "prompt",
        title: "Version B — slow push-in",
        text: "The entrepreneur slowly walks toward the camera while maintaining eye contact. Warm sunlight passes through the windows. Slow camera push-in, natural body movement, realistic background motion.",
      },
      {
        kind: "prompt",
        title: "Version C — lateral tracking",
        text: "The entrepreneur walks along the office window line from left to right, sunlight banding across his suit. Camera tracks beside him at chest height, smooth cinematic movement, realistic gait, photorealistic.",
      },
      {
        kind: "list",
        title: "How to score a video output",
        items: [
          "Motion — does the body move like a person, or slide and smear?",
          "Face stability — does the identity hold for the whole clip?",
          "Camera obedience — did it push in, or invent a whip pan?",
          "Realism — hands, cloth, light, background.",
          "Usefulness — can you cut this into a story, or is it only a demo?",
        ],
      },
      {
        kind: "assignment",
        text: "Use one image to create three different video outputs. Score motion, face stability, camera obedience and realism. Choose one output and explain why. Paste your winning motion prompt in Studio.",
      },
    ],
  },
  {
    id: 5,
    slug: "consistent-characters",
    title: "Creating consistent characters and scenes",
    subtitle: "Build your character bible before the story",
    minutes: 16,
    blocks: [
      {
        kind: "learn",
        items: [
          "Define a repeatable character identity.",
          "Lock wardrobe and environment details.",
          "Use references consistently.",
          "Protect important objects and visual details.",
        ],
      },
      {
        kind: "p",
        text: "Consistency turns individual generations into a story world. Before your production begins, make a character card. If the character changes face, age, or clothes between shots, the audience stops believing the story.",
      },
      {
        kind: "h",
        text: "Character card",
      },
      {
        kind: "formula",
        text: "Name · Age · Gender · Appearance · Hair · Eyes · Build · Wardrobe · Personality · Visual Style · Important Props",
      },
      {
        kind: "p",
        text: "Fill every field before you generate. Empty fields become random choices the model will invent for you.",
      },
      {
        kind: "prompt",
        title: "Character prompt — Daniel",
        text: "Daniel, a 28-year-old Nigerian man with dark brown skin, short black hair, brown eyes, athletic build, wearing a fitted black T-shirt, blue jeans and clean white sneakers, calm confident expression, realistic facial proportions, natural skin texture, photorealistic cinematic portrait, vertical 9:16.",
      },
      {
        kind: "list",
        title: "Daniel — filled character bible",
        items: [
          "Name: Daniel",
          "Age: 28",
          "Gender: man",
          "Appearance: dark brown skin, realistic facial proportions, natural skin texture",
          "Hair: short black hair",
          "Eyes: brown",
          "Build: athletic",
          "Wardrobe: fitted black T-shirt, blue jeans, clean white sneakers",
          "Personality: calm, confident",
          "Visual style: photorealistic cinematic portrait",
          "Important props: none locked yet — add a watch, bag or phone only if the story needs it every time",
        ],
      },
      {
        kind: "h",
        text: "Six continuity steps",
      },
      {
        kind: "steps",
        items: [
          { title: "Create the reference", body: "Generate the strongest portrait you can. This is the identity lock, not a poster." },
          { title: "Record the identity details", body: "Write down the exact visible features: hairline, skin, eyes, build, any mark that must return." },
          { title: "Lock the wardrobe", body: "Define colors, materials and accessories. “Black T-shirt” is not enough if one frame becomes a hoodie." },
          { title: "Lock the environment", body: "Describe fixed location details: wall colour, time of day, weather, key objects." },
          { title: "Reuse the reference", body: "Use it in every scene where the character appears. Say “the same person from the reference.”" },
          { title: "Check continuity", body: "Compare the new frame against the reference before moving on. If identity drifted, regenerate before you animate." },
        ],
      },
      {
        kind: "h",
        text: "Same character, four locations",
      },
      {
        kind: "prompt",
        title: "Daniel — neighborhood street",
        text: "Daniel from the reference, a 28-year-old Nigerian man with dark brown skin, short black hair, brown eyes, athletic build, wearing a fitted black T-shirt, blue jeans and clean white sneakers, standing on a Lagos neighborhood street at late afternoon, calm confident expression, photorealistic cinematic full body, vertical 9:16.",
      },
      {
        kind: "prompt",
        title: "Daniel — small apartment",
        text: "Daniel from the reference, same face and wardrobe, sitting on the edge of a bed in a small Lagos apartment, warm practical lamp, calm thoughtful expression, photorealistic cinematic medium shot, vertical 9:16.",
      },
      {
        kind: "prompt",
        title: "Daniel — bus stop at night",
        text: "Daniel from the reference, same face and wardrobe, waiting at a Lagos bus stop at night, cool street light, athletic build, fitted black T-shirt, blue jeans, clean white sneakers, photorealistic cinematic frame, vertical 9:16.",
      },
      {
        kind: "prompt",
        title: "Daniel — rooftop morning",
        text: "Daniel from the reference, same face and wardrobe, standing on a city rooftop at sunrise, calm confident expression, athletic build, fitted black T-shirt, blue jeans, clean white sneakers, photorealistic cinematic portrait, vertical 9:16.",
      },
      {
        kind: "assignment",
        text: "Create a one-page character bible and generate the same character in four different locations. Fill the Studio character bible and submit it for the author to rate.",
      },
    ],
  },
  {
    id: 6,
    slug: "prompt-engineering",
    title: "Prompt engineering for better results",
    subtitle: "Write instructions that can actually direct a model",
    minutes: 20,
    blocks: [
      {
        kind: "learn",
        items: [
          "Understand the anatomy of a strong prompt.",
          "Build prompts in layers.",
          "Troubleshoot one problem at a time.",
          "Create reusable prompt templates.",
        ],
      },
      {
        kind: "p",
        text: "A prompt is not a wish. It is direction. The model can only obey what you actually specified. Vague prompts produce average images. Layered prompts produce shots.",
      },
      {
        kind: "h",
        text: "The basic prompt formula",
      },
      {
        kind: "formula",
        text: "SUBJECT + ACTION + ENVIRONMENT + CAMERA + LIGHTING + EMOTION + STYLE + FORMAT",
      },
      {
        kind: "steps",
        items: [
          { title: "Define the subject", body: "Who or what is the audience seeing? Name, age, body, wardrobe, identity lock." },
          { title: "Add the action", body: "What is happening now? One verb. Walk. Sit. Look. Reach." },
          { title: "Describe the environment", body: "Where is the scene taking place? City, interior, weather, time, background activity." },
          { title: "Direct the camera", body: "How should the audience see it? Close-up, medium, wide, push-in, track, static." },
          { title: "Control lighting", body: "What kind of light, time and atmosphere should exist? Sunrise, practical lamps, overcast, neon." },
          { title: "Add emotion", body: "What should the subject and audience feel? Calm ambition is not the same as fear." },
          { title: "Define visual style", body: "Photorealistic, cinematic, documentary, commercial, and so on." },
          { title: "Specify format", body: "For example, vertical 9:16 or landscape 16:9. Aspect ratio is part of composition." },
        ],
      },
      {
        kind: "h",
        text: "Weak prompt versus directed prompt",
      },
      {
        kind: "prompt",
        title: "Weak — too little direction",
        text: "A man walking in a city, cinematic, 9:16.",
      },
      {
        kind: "p",
        text: "That prompt leaves identity, wardrobe, city, time, camera, light and feeling to chance. You might get a usable frame. You will not get a repeatable character.",
      },
      {
        kind: "prompt",
        title: "Master example — eight layers filled",
        text: "A young Nigerian entrepreneur walking confidently toward the camera through a busy Lagos business district during golden hour, wearing a fitted dark suit and white shirt, calm ambitious expression, natural pedestrians and traffic in the background, medium cinematic tracking composition, warm golden sunlight, shallow depth of field, realistic skin texture, photorealistic cinematic movie frame, high detail, vertical 9:16.",
      },
      {
        kind: "list",
        title: "The master example, labelled",
        items: [
          "Subject: a young Nigerian entrepreneur in a fitted dark suit and white shirt, realistic skin texture.",
          "Action: walking confidently toward the camera.",
          "Environment: busy Lagos business district, natural pedestrians and traffic.",
          "Camera: medium cinematic tracking composition, shallow depth of field.",
          "Lighting: golden hour, warm golden sunlight.",
          "Emotion: calm ambitious expression.",
          "Style: photorealistic cinematic movie frame, high detail.",
          "Format: vertical 9:16.",
        ],
      },
      {
        kind: "h",
        text: "Reusable templates — keep the lock, change the beat",
      },
      {
        kind: "prompt",
        title: "Template — same man, night beat",
        text: "A young Nigerian entrepreneur walking calmly toward the camera through a quiet Lagos business district at night, wearing a fitted dark suit and white shirt, thoughtful expression, sparse pedestrians in the background, medium cinematic tracking composition, cool street lighting with warm shop windows, shallow depth of field, realistic skin texture, photorealistic cinematic movie frame, high detail, vertical 9:16.",
      },
      {
        kind: "prompt",
        title: "Template — same man, close-up",
        text: "Close-up of a young Nigerian entrepreneur, fitted dark suit and white shirt, calm ambitious expression, realistic skin texture, busy Lagos business district softly out of focus behind him, golden hour, warm golden sunlight, photorealistic cinematic movie frame, high detail, vertical 9:16.",
      },
      {
        kind: "rule",
        title: "The debugging rule",
        text: "When the result is wrong, identify the exact failure first. Then change the smallest part of the prompt that could correct it.",
      },
      {
        kind: "list",
        title: "Debug map",
        items: [
          "Wrong person → strengthen subject and reuse the reference.",
          "Wrong clothes → name colour, fit and fabric. Repeat them.",
          "Wrong place → name the city, the street type, the background activity.",
          "Wrong camera → name shot size and one movement. Remove extra movements.",
          "Wrong light → name time of day and direction of light.",
          "Wrong feeling → name the expression and body language.",
          "Wrong format → state 9:16 or 16:9 every time.",
        ],
      },
      {
        kind: "assignment",
        text: "Take one weak prompt from your old work and rebuild it using the eight-part formula. Generate both versions and compare them. Assemble the strong version in Studio with the eight fields and submit it for rating.",
      },
    ],
  },
  {
    id: 7,
    slug: "cinematic-frames",
    title: "Building cinematic scenes with frames",
    subtitle: "Think like a director, not just a generator",
    minutes: 16,
    blocks: [
      {
        kind: "learn",
        items: [
          "Plan a visual sequence before animating.",
          "Use frames as key moments.",
          "Connect frames with camera direction.",
          "Create scale progression and continuity.",
        ],
      },
      {
        kind: "p",
        text: "A strong sequence feels connected. One way to create that feeling is to design several keyframes before you animate them. Each frame becomes a visual checkpoint. The audience should feel that the camera is travelling, not teleporting.",
      },
      {
        kind: "h",
        text: "Practical sequence — Lagos street to Earth",
      },
      {
        kind: "list",
        items: [
          "Frame 1: Person in a Lagos street.",
          "Frame 2: Camera begins rising.",
          "Frame 3: City expands below.",
          "Frame 4: Wider metropolitan view.",
          "Frame 5: Atmosphere and clouds.",
          "Frame 6: Earth from space.",
        ],
      },
      {
        kind: "p",
        text: "Notice the logic: we start with a human, then we earn each wider scale. If you jump from a face to the planet, the journey is a slideshow. If you rise through the city, the planet means something.",
      },
      {
        kind: "prompt",
        title: "Frame 1 — person in a Lagos street",
        text: "A young Nigerian man standing in a busy Lagos street, photorealistic cinematic wide-enough medium shot, natural daylight, realistic architecture and pedestrians, grounded eye-level camera, high detail, vertical 9:16.",
      },
      {
        kind: "prompt",
        title: "Frame 2 — camera begins rising",
        text: "Same Lagos street as the previous frame, camera slightly higher looking down toward the young Nigerian man, more rooftops visible, continuous daylight, photorealistic cinematic frame, vertical 9:16.",
      },
      {
        kind: "prompt",
        title: "Frame 3 — city expands below",
        text: "Elevated cinematic view of Lagos, streets and buildings spreading below, the original street still readable in the composition, late-afternoon light, photorealistic, vertical 9:16.",
      },
      {
        kind: "prompt",
        title: "Frame 6 — Earth from space",
        text: "Photorealistic view of Earth from space with Africa visible, thin atmosphere on the curve of the planet, cinematic, continuous visual journey from the city far below, vertical 9:16.",
      },
      {
        kind: "prompt",
        title: "Continuity master prompt",
        text: "Use the uploaded reference images in chronological order as continuous visual keyframes. Do not treat them as unrelated scenes. Create one seamless camera movement connecting every image. Preserve spatial continuity, scale progression, lighting continuity and environmental consistency. No jump cuts, no teleportation, no scene resets. Maintain realistic scale progression throughout the sequence.",
      },
      {
        kind: "rule",
        title: "Directing principle",
        text: "Decide why the camera moves before you decide how it moves. A camera move should reveal information, create emotion, increase tension or guide attention.",
      },
      {
        kind: "list",
        title: "Camera movements to practice",
        items: [
          "Push-in: move closer to increase emphasis.",
          "Pull-out: reveal context or create emotional distance.",
          "Pan: look horizontally across the scene.",
          "Tilt: reveal information vertically.",
          "Tracking: follow a moving subject.",
          "Crane: change height and perspective.",
        ],
      },
      {
        kind: "assignment",
        text: "Create six frames that visually progress from close to wide. Animate them as a single continuous journey. Submit your continuity prompt in Studio.",
      },
    ],
  },
  {
    id: 8,
    slug: "dialogue-videos",
    title: "Creating professional AI dialogue videos",
    subtitle: "Make characters talk, react and feel believable",
    minutes: 16,
    blocks: [
      {
        kind: "learn",
        items: [
          "Create a cast.",
          "Write natural dialogue.",
          "Direct emotional delivery.",
          "Plan dialogue shots.",
          "Maintain continuity between speakers.",
        ],
      },
      {
        kind: "p",
        text: "Dialogue scenes are more demanding because your visuals, speech, emotions and timing must agree. Start with a simple two-character scene in one location. One room. One disagreement. One resolution.",
      },
      {
        kind: "h",
        text: "Build the scene before the lines",
      },
      {
        kind: "steps",
        items: [
          { title: "Create the cast", body: "Define appearance, personality, voice and wardrobe for each speaker. Two character bibles, not one." },
          { title: "Define the relationship", body: "Explain what each character wants and what they disagree about. Want versus want is drama." },
          { title: "Write short lines", body: "Keep sentences natural and easy to perform. If a line is hard to say, it will be hard to generate." },
          { title: "Add delivery direction", body: "Describe whether the line is calm, angry, nervous, amused or uncertain." },
          { title: "Break into shots", body: "Use a two-shot, close-up, over-the-shoulder and reaction shot." },
          { title: "Check continuity", body: "Keep the same room, wardrobe, props and lighting. A glass that vanishes is a continuity error." },
        ],
      },
      {
        kind: "list",
        title: "Scene card — the test",
        items: [
          "Location: a small Lagos office, late afternoon, one desk, two chairs, city in the window.",
          "Daniel wants: to launch the product this month.",
          "Michael wants: proof before risk.",
          "Disagreement: timing versus evidence.",
          "Resolution: the fifty-customer test becomes the reason to proceed.",
        ],
      },
      {
        kind: "h",
        text: "Dialogue example",
      },
      {
        kind: "dialogue",
        lines: [
          { speaker: "Daniel", direction: "calm but determined", line: "I know it sounds risky." },
          {
            speaker: "Michael",
            direction: "skeptical, leaning forward",
            line: "Risky is not the problem. What makes you think people will buy it?",
          },
          {
            speaker: "Daniel",
            direction: "confident",
            line: "Because I already tested it with fifty customers.",
          },
        ],
      },
      {
        kind: "p",
        text: "Three lines. A relationship. A turn. That is enough for a 30–60 second scene. Do not write a play. Write something a face can carry.",
      },
      {
        kind: "prompt",
        title: "Two-shot — both men in the office",
        text: "Photorealistic cinematic two-shot of Daniel and Michael in a small Lagos office at late afternoon, Daniel in a fitted black T-shirt, Michael in a light shirt, sitting across a desk, city visible through the window, natural motivated lighting, realistic skin texture, vertical 9:16.",
      },
      {
        kind: "prompt",
        title: "Close-up — Daniel delivering the last line",
        text: "Photorealistic cinematic close-up of Daniel, 28-year-old Nigerian man, dark brown skin, short black hair, brown eyes, fitted black T-shirt, calm confident expression as he speaks, small Lagos office softly behind him, late afternoon light, vertical 9:16.",
      },
      {
        kind: "prompt",
        title: "Reaction — Michael listening",
        text: "Photorealistic cinematic close-up of Michael listening, skeptical but processing the news, leaning slightly forward, light shirt, small Lagos office, late afternoon, natural pause, no speech in this frame, vertical 9:16.",
      },
      {
        kind: "rule",
        title: "Reaction matters",
        text: "A dialogue scene is not only about who is speaking. The person listening is also acting. Plan eye contact, pauses, posture and reaction shots.",
      },
      {
        kind: "assignment",
        text: "Create a 30–60 second dialogue scene with two characters, one location, one disagreement, at least three camera angles and a clear resolution. Submit both character prompts in Studio.",
      },
    ],
  },
  {
    id: 9,
    slug: "voice-sound-music",
    title: "AI voice, sound effects and music",
    subtitle: "Build the sound world of your story",
    minutes: 14,
    blocks: [
      {
        kind: "learn",
        items: [
          "Choose a suitable narration voice.",
          "Write for natural delivery.",
          "Add environmental sound.",
          "Match music to emotion.",
          "Balance the three audio layers.",
        ],
      },
      {
        kind: "p",
        text: "Sound often separates a rough AI video from a cinematic-feeling video. Build the soundtrack in layers instead of dropping one music track under the entire project.",
      },
      {
        kind: "h",
        text: "The three layers",
      },
      {
        kind: "list",
        items: [
          "Voice-over: loudest and clearest.",
          "Sound effects: medium, used to support actions and environment.",
          "Background music: lower, used to shape emotion.",
        ],
      },
      {
        kind: "steps",
        items: [
          { title: "Write the narration", body: "Use short sentences and intentional pauses. Read it out loud before you generate a voice." },
          { title: "Choose the voice", body: "Match age, personality, tone and story style. A children’s story should not sound like a newsreader." },
          { title: "Add ambience", body: "Give every environment a believable room, street or outdoor sound. Silence in a city street is a mistake." },
          { title: "Add action effects", body: "Use footsteps, doors, phone sounds, traffic, rain or other relevant effects." },
          { title: "Add music", body: "Change the music when the emotional direction changes. Do not loop one mood over a whole story." },
          { title: "Balance the mix", body: "Lower music and effects until narration remains easy to understand." },
        ],
      },
      {
        kind: "h",
        text: "Write for the mouth",
      },
      {
        kind: "p",
        text: "Compare: “Greg, who had always believed that he was too small to belong with the other dogs, finally understood something important.” That line is an essay. Now: “Greg was the smallest dog on the street.” Cut. “He watched.” Cut. “Then he trained.” The second version can be performed.",
      },
      {
        kind: "list",
        title: "Greg — sound sketch",
        items: [
          "Ambience: neighborhood air, distant traffic, birds, other dogs far away.",
          "Action: paws on concrete, a short run, breathing after effort.",
          "Voice: warm, close, not cartoon, not announcer.",
          "Music: quiet at the watch, a low pulse during training, a hopeful lift on the return walk.",
        ],
      },
      {
        kind: "prompt",
        title: "Music direction prompt",
        text: "Cinematic motivational score, warm emotional opening, subtle tension in the middle, gradual inspirational build, restrained percussion, emotional strings and a hopeful final lift, designed to sit underneath clear narration.",
      },
      {
        kind: "p",
        text: "Give music the same care you give image prompts. “Epic music” will fight the voice. “Designed to sit underneath clear narration” is a mix instruction.",
      },
      {
        kind: "assignment",
        text: "Take one 10-second clip and make three versions: voice only, voice plus effects, and voice plus effects plus music. Compare the emotional difference. Write your music direction in Studio and submit it.",
      },
    ],
  },
  {
    id: 10,
    slug: "editing-capcut",
    title: "Editing your AI content in CapCut",
    subtitle: "Bring every piece together",
    minutes: 14,
    blocks: [
      {
        kind: "learn",
        items: [
          "Build a clean timeline.",
          "Sync visuals with narration.",
          "Add captions and sound.",
          "Use transitions with purpose.",
          "Perform a final quality check.",
        ],
      },
      {
        kind: "p",
        text: "Editing is where the short clips become a story. CapCut is the assembly room. If the timeline is messy, the film will feel messy even when the generations were good.",
      },
      {
        kind: "steps",
        items: [
          { title: "Create the project", body: "For vertical short-form work, use a 9:16 project at 1080 × 1920 and a suitable frame rate." },
          { title: "Import the assets", body: "Bring in your clips, narration, music, effects and logo. Name them. Shot1, Shot2, VO, SFX, Music." },
          { title: "Build the story first", body: "Arrange the footage before adding decorative effects. Picture and voice. Nothing else yet." },
          { title: "Add narration", body: "Align cuts to ideas and important words. Cut on meaning, not only on motion." },
          { title: "Add captions", body: "Generate automatic captions and correct mistakes. Wrong names and broken words destroy trust." },
          { title: "Add effects and music", body: "Support the story without covering the voice." },
          { title: "Add branding", body: "Use a short end card or subtle identity mark. Do not stamp a giant logo over the first frame." },
          { title: "Watch the whole video", body: "Check pacing, continuity, sound and readability from the audience perspective." },
          { title: "Export", body: "Use the format appropriate to your platform." },
        ],
      },
      {
        kind: "list",
        title: "Caption rules",
        items: [
          "Keep captions inside the safe viewing area.",
          "Correct every name, especially Greg, Lagos, Daniel, Michael.",
          "Do not cover faces. Place captions lower, then check platform UI.",
          "One or two lines. Not a paragraph.",
        ],
      },
      {
        kind: "list",
        title: "Transitions",
        items: [
          "A cut is the default. Use it.",
          "A dissolve can mean time passing. Use it rarely.",
          "A flashy transition is not style. It is noise unless the story asks for it.",
        ],
      },
      {
        kind: "rule",
        title: "Editing test",
        text: "Watch your final video once without touching the timeline. Write down every moment where your attention drops, then edit only those moments.",
      },
      {
        kind: "assignment",
        text: "Edit your dialogue or storytelling project completely in CapCut, including captions, sound effects, music and branding.",
      },
    ],
  },
  {
    id: 11,
    slug: "complete-story",
    title: "Building a complete AI story from idea to final video",
    subtitle: "Your first full production",
    minutes: 18,
    blocks: [
      {
        kind: "learn",
        items: [
          "Plan a story from beginning to end.",
          "Combine character, prompt and frame skills.",
          "Produce a complete short-form package.",
        ],
      },
      {
        kind: "h",
        text: "Practical story — The Last Message",
      },
      {
        kind: "rule",
        title: "Logline",
        text: "The Last Message — A young man receives a mysterious message that appears to come from his future self.",
      },
      {
        kind: "p",
        text: "This project combines everything you have learned: character bible, eight-part prompts, frames, motion, voice, sound, edit, captions and branding. One mystery. One hour of story-time. Thirty to sixty seconds of film.",
      },
      {
        kind: "h",
        text: "Sample narration",
      },
      {
        kind: "p",
        text: "Midnight. The phone lights the room. One message. No name. “You have one hour to change everything.” He thinks it is a joke. Then he sees the time stamp. It has not happened yet. He stands. He goes outside. The street is the same. He is not.",
      },
      {
        kind: "steps",
        items: [
          { title: "Create the hook", body: "“You have one hour to change everything.” Put that line on screen or in the voice in the first seconds." },
          { title: "Write the script", body: "Keep the story focused on one mystery. Do not explain the entire future. Leave a question alive." },
          { title: "Create the character", body: "Build the main character reference. A young Nigerian man, specific, repeatable." },
          { title: "Define locations", body: "Bedroom, street and one final location. Three places are enough." },
          { title: "Build the shot list", body: "Use six to eight visual shots. One purpose each." },
          { title: "Generate images", body: "Create keyframes and correct continuity problems before you animate." },
          { title: "Animate", body: "Give every shot one primary action." },
          { title: "Create narration", body: "Use a tense, controlled storytelling voice." },
          { title: "Design sound", body: "Phone vibration, room tone, footsteps and tension music." },
          { title: "Edit", body: "Let the narration control the pacing." },
          { title: "Publish package", body: "Create title, caption, CTA and final export." },
        ],
      },
      {
        kind: "list",
        title: "Eight-shot list",
        items: [
          "Shot 1: dark bedroom, phone screen ignites.",
          "Shot 2: close-up of the message: “You have one hour to change everything.”",
          "Shot 3: his face, disbelief.",
          "Shot 4: he sits up, room tone, feet on the floor.",
          "Shot 5: he steps into the night street.",
          "Shot 6: the same street, slightly too still.",
          "Shot 7: he looks at the phone again. Time is moving.",
          "Shot 8: he walks, decision made, ending open.",
        ],
      },
      {
        kind: "prompt",
        title: "Hook prompt — the phone in the dark",
        text: "A mysterious smartphone screen lights up in a dark bedroom at midnight. A young Nigerian man stares at the message in disbelief, cinematic lighting, realistic night atmosphere, close-up, photorealistic, vertical 9:16.",
      },
      {
        kind: "prompt",
        title: "Message insert",
        text: "Extreme close-up of a smartphone screen in a dark bedroom, white text on a dark message thread reading a mysterious warning, realistic phone UI glow lighting a young Nigerian man’s fingers, cinematic, photorealistic, vertical 9:16.",
      },
      {
        kind: "prompt",
        title: "Street — after the message",
        text: "A young Nigerian man from the bedroom reference, standing on a quiet Lagos street at midnight, phone in his hand, tense controlled expression, cool street lighting, photorealistic cinematic medium shot, vertical 9:16.",
      },
      {
        kind: "prompt",
        title: "Motion — the sit-up",
        text: "The young man sits up in bed as the phone glows. Small realistic body movement, blanket shifting, tense atmosphere, static camera, photorealistic, midnight bedroom.",
      },
      {
        kind: "assignment",
        text: "Produce your own 30–60 second short story using the complete workflow. Save every stage, not only the final export. Submit your hook prompt and character bible in Studio for rating.",
      },
    ],
  },
  {
    id: 12,
    slug: "advertisements",
    title: "Creating high-end AI advertisements",
    subtitle: "Turn products into visual stories",
    minutes: 14,
    blocks: [
      {
        kind: "learn",
        items: [
          "Write an advertising hook.",
          "Show a problem and solution.",
          "Create product-focused shots.",
          "End with a clear call to action.",
        ],
      },
      {
        kind: "h",
        text: "The ad formula",
      },
      {
        kind: "pipeline",
        items: ["Problem", "Product", "Benefit", "Proof", "Call to action"],
      },
      {
        kind: "p",
        text: "An advertisement is a short story with a job. The job is not “look expensive.” The job is to move a specific person from a pain to an action.",
      },
      {
        kind: "steps",
        items: [
          { title: "Choose the product", body: "Start with one product or service. One. Not a catalogue." },
          { title: "Define the audience", body: "Who needs it most? A 24-year-old graduate is not a 50-year-old founder." },
          { title: "Create the hook", body: "Write a short line that creates curiosity. If they scroll past the first second, the ad did not start." },
          { title: "Show the problem", body: "Visualize the customer pain point. Tired. Late. Invisible. Overwhelmed." },
          { title: "Reveal the product", body: "Make the product the hero of the frame." },
          { title: "Show the transformation", body: "Demonstrate the benefit visually. Before and after is still powerful." },
          { title: "Add detail shots", body: "Use close-ups of texture, packaging, interface or features." },
          { title: "Finish with CTA", body: "Tell the viewer what to do next. Visit. Order. Send a message. Save this." },
        ],
      },
      {
        kind: "list",
        title: "Sample 20-second fashion ad",
        items: [
          "Hook: “They noticed the walk before they noticed the logo.”",
          "Problem: a young professional blending into a dull commute.",
          "Product: tailored outfit, fabric close-up, brand mark small and clean.",
          "Benefit: posture changes, light changes, the city feels like a set.",
          "CTA: “Shop the Lagos drop. Link in bio.”",
        ],
      },
      {
        kind: "prompt",
        title: "Commercial image prompt",
        text: "High-end cinematic commercial for a premium Nigerian fashion brand, elegant young Nigerian professional wearing a tailored modern outfit, luxury urban environment, precise fabric detail, controlled studio lighting, cinematic depth of field, polished commercial cinematography, premium advertising aesthetic, photorealistic, vertical 9:16.",
      },
      {
        kind: "prompt",
        title: "Problem frame — the dull commute",
        text: "Photorealistic cinematic frame of a young Nigerian professional in a crowded Lagos commute, muted colours, tired posture, ordinary wardrobe, overcast light, documentary-commercial hybrid, vertical 9:16.",
      },
      {
        kind: "prompt",
        title: "Product hero — fabric and cut",
        text: "Extreme close-up of tailored fabric on a young Nigerian professional, precise stitching, natural drape, controlled studio lighting, premium advertising aesthetic, photorealistic, vertical 9:16.",
      },
      {
        kind: "prompt",
        title: "CTA end card direction",
        text: "Clean cinematic end card, dark warm background, the fashion brand name in elegant type, short call to action underneath, premium advertising aesthetic, vertical 9:16, photorealistic lighting on the typography, no clutter.",
      },
      {
        kind: "assignment",
        text: "Create a 15–30 second advertisement for a Nigerian product. Include a hook, product reveal, benefit, transformation and CTA. Submit your commercial prompt in Studio.",
      },
    ],
  },
  {
    id: 13,
    slug: "filmmaking",
    title: "AI filmmaking from pre-production to post-production",
    subtitle: "Use a filmmaker mindset",
    minutes: 16,
    blocks: [
      {
        kind: "learn",
        items: [
          "Plan before generating.",
          "Think in shots and sequences.",
          "Maintain continuity.",
          "Finish with editorial and sound decisions.",
        ],
      },
      {
        kind: "h",
        text: "Three stages",
      },
      {
        kind: "list",
        items: [
          "Pre-production: story, characters, locations, wardrobe, props, shot list.",
          "Production: references, frames, video clips, dialogue and voice.",
          "Post-production: editing, sound, music, captions, color and branding.",
        ],
      },
      {
        kind: "p",
        text: "Before generating a shot, ask five questions: What is the story beat? What does the character feel? What does the audience need to see? Where is the camera? Why is the camera there?",
      },
      {
        kind: "list",
        title: "Pre-production folder",
        items: [
          "One-page story: hook, problem, change, ending.",
          "Character bibles for every speaking or repeating person.",
          "Location list with time of day and light.",
          "Wardrobe lock for each character.",
          "Prop list: only objects that must return.",
          "Shot list: number, size, action, camera, duration.",
        ],
      },
      {
        kind: "rule",
        title: "Film project",
        text: "Create a 60-second short film with one main character, one supporting character, two locations, eight shots, voice or dialogue, sound design, music and an emotional ending.",
      },
      {
        kind: "prompt",
        title: "Director prompt — every frame should survive this",
        text: "Photorealistic cinematic short-film frame, emotionally grounded performance, natural body language, deliberate composition, realistic environment, motivated lighting, subtle depth of field, filmic camera language, visual continuity with the previous shot, vertical 9:16.",
      },
      {
        kind: "p",
        text: "Add the director prompt after your subject and action. It is a taste lock. It tells the model you are making a film frame, not a random illustration.",
      },
      {
        kind: "assignment",
        text: "Produce the 60-second short film and keep a production folder containing your references, prompts, generated frames, clips, audio and final edit. Submit your director prompt in Studio.",
      },
    ],
  },
  {
    id: 14,
    slug: "music-videos",
    title: "Creating AI music videos and visual stories",
    subtitle: "Let the music drive the visual rhythm",
    minutes: 14,
    blocks: [
      {
        kind: "learn",
        items: [
          "Understand the story inside a song.",
          "Build visual chapters.",
          "Match shot length to musical energy.",
          "Keep the visual identity consistent.",
        ],
      },
      {
        kind: "p",
        text: "A music video is not a random gallery set to a beat. The song already has chapters. Your job is to see them.",
      },
      {
        kind: "steps",
        items: [
          { title: "Understand the song", body: "Identify mood, tempo, story and emotional high points. Mark the chorus. Mark the quiet." },
          { title: "Create the visual concept", body: "Translate the song into a visual world. Neighborhood to city is one world. Palace to dust is another." },
          { title: "Build visual chapters", body: "For example: struggle, dream, movement, breakthrough, success." },
          { title: "Match rhythm", body: "Use slower shots for reflective passages and faster cuts for energetic moments." },
          { title: "Maintain character continuity", body: "Use references consistently across the video. The singer or hero must remain one person." },
          { title: "Create the climax", body: "Build toward the musical high point. Hold a shot. Then release." },
        ],
      },
      {
        kind: "list",
        title: "Five visual chapters — ambition",
        items: [
          "Struggle: modest neighborhood, warm but limited light, close-ups of work.",
          "Dream: eyes, sky, a still moment that wants more.",
          "Movement: walking, riding, the city beginning to open.",
          "Breakthrough: brighter light, faster cuts, the first wide of the new world.",
          "Success: held wide or slow push-in, the character finally still inside the new city.",
        ],
      },
      {
        kind: "prompt",
        title: "Music-video visual prompt",
        text: "Cinematic visual story about ambition, young African creator moving from a modest neighborhood toward a bright modern city, progression from struggle to confidence, expressive close-ups, dynamic city movement, warm-to-bright lighting progression, photorealistic, high-end music video aesthetic, 9:16.",
      },
      {
        kind: "prompt",
        title: "Chapter — struggle",
        text: "Young African creator in a modest neighborhood at dawn, photorealistic, warm limited light, expressive close-up, quiet determination, high-end music video aesthetic, vertical 9:16.",
      },
      {
        kind: "prompt",
        title: "Chapter — breakthrough",
        text: "The same young African creator from the reference entering a bright modern city, photorealistic, stronger daylight, confident walk, dynamic environment, high-end music video aesthetic, vertical 9:16.",
      },
      {
        kind: "assignment",
        text: "Create a 30–60 second music visual with five visual chapters and one repeating main character. Submit the master visual prompt in Studio.",
      },
    ],
  },
  {
    id: 15,
    slug: "content-machine",
    title: "Turning your niche into a content machine",
    subtitle: "One niche, many repeatable formats",
    minutes: 12,
    blocks: [
      {
        kind: "learn",
        items: [
          "Create content pillars.",
          "Reuse production work intelligently.",
          "Build a series.",
          "Use interactive formats.",
        ],
      },
      {
        kind: "p",
        text: "A niche is not one video. A niche is a factory of related videos. Pillars keep you from inventing a new identity every Monday.",
      },
      {
        kind: "list",
        title: "Example: AI filmmaking",
        items: [
          "Pillar 1: Short films.",
          "Pillar 2: Behind-the-scenes creation.",
          "Pillar 3: Tutorials and prompt breakdowns.",
        ],
      },
      {
        kind: "rule",
        title: "One idea → five posts",
        text: "One short film can become the full film, trailer, character introduction, behind-the-scenes, prompt breakdown and an audience poll.",
      },
      {
        kind: "h",
        text: "Content series",
      },
      {
        kind: "p",
        text: "Example: AI Filmmaker Journey — Idea → Character → Frames → Animation → Editing → Final Film. Each episode teaches one stage and sells the next.",
      },
      {
        kind: "pipeline",
        items: ["Idea", "Character", "Frames", "Animation", "Editing", "Final film"],
      },
      {
        kind: "list",
        title: "Five purposes for five posts",
        items: [
          "Entertain: the finished film.",
          "Educate: the prompt breakdown.",
          "Reveal: behind the scenes, including failures.",
          "Engage: poll, “which ending?”, tool challenge.",
          "Convert: the offer, the class, the brand, the follow.",
        ],
      },
      {
        kind: "assignment",
        text: "Take one idea and turn it into five pieces of content. Give each piece a different purpose: entertain, educate, reveal, engage and convert.",
      },
    ],
  },
  {
    id: 16,
    slug: "content-workflow",
    title: "Building your AI content workflow",
    subtitle: "Create a process you can repeat",
    minutes: 14,
    blocks: [
      {
        kind: "learn",
        items: [
          "Organize files and assets.",
          "Create reusable templates.",
          "Save successful prompts.",
          "Build quality-control checklists.",
        ],
      },
      {
        kind: "p",
        text: "Talent that cannot be repeated is a hobby. A workflow turns talent into a practice. Name your folders. Name your prompts. Name your gates.",
      },
      {
        kind: "list",
        title: "Sample folder system",
        items: [
          "01 Ideas",
          "02 Scripts",
          "03 Characters",
          "04 Images",
          "05 Video",
          "06 Voice",
          "07 Sound",
          "08 Final",
        ],
      },
      {
        kind: "steps",
        items: [
          { title: "Standardize inputs", body: "Use the same brief fields for every project: topic, audience, platform, duration, style, CTA." },
          { title: "Standardize outputs", body: "Always create title, hook, script, shot list, prompts, caption and CTA." },
          { title: "Build a prompt library", body: "Save character, environment, camera, image, video, dialogue and music prompts." },
          { title: "Create checkpoints", body: "Approve the idea before production and the final cut before publishing." },
          { title: "Review performance", body: "Record what worked and what did not, then improve the template." },
        ],
      },
      {
        kind: "list",
        title: "Quality-control checklist",
        items: [
          "Identity holds across frames.",
          "Wardrobe and props do not teleport.",
          "One main action per clip.",
          "Voice is clear over music.",
          "Captions are correct and in the safe area.",
          "Branding is present, not shouting.",
          "Export matches the platform.",
        ],
      },
      {
        kind: "assignment",
        text: "Create a one-page standard operating procedure for your niche. A new student should be able to follow it without asking you what to do next.",
      },
    ],
  },
  {
    id: 17,
    slug: "ai-agents",
    title: "AI agents and agent-mode workflows",
    subtitle: "Think in tasks, not just prompts",
    minutes: 14,
    blocks: [
      {
        kind: "learn",
        items: [
          "Break work into tasks.",
          "Define inputs and outputs.",
          "Create approval checkpoints.",
          "Prepare processes for future automation.",
        ],
      },
      {
        kind: "p",
        text: "An AI agent workflow is easier to control when the work is defined as a sequence of small tasks. The creative goal remains yours; the system helps move information from one stage to the next.",
      },
      {
        kind: "steps",
        items: [
          { title: "Define the goal", body: "Example: create one short educational video." },
          { title: "Define the input", body: "Topic, audience, platform, tone and duration." },
          { title: "Define the output", body: "Idea, hook, script, shot list, prompts, caption and CTA." },
          { title: "Add checkpoints", body: "Approve the idea, script, visuals and final cut. A human still says yes." },
          { title: "Document the workflow", body: "Write the exact instructions so the process can be repeated." },
        ],
      },
      {
        kind: "list",
        title: "Task map — one educational short",
        items: [
          "Task 1: turn a topic into three idea options.",
          "Task 2: human picks one idea.",
          "Task 3: write hook + 80-word script.",
          "Task 4: human edits the script.",
          "Task 5: build shot list from the script.",
          "Task 6: write image prompts per shot.",
          "Task 7: generate, then human rejects broken frames.",
          "Task 8: write motion prompts for survivors.",
          "Task 9: assemble caption and CTA.",
        ],
      },
      {
        kind: "rule",
        title: "Important",
        text: "Do not automate a messy process. First make the manual workflow good. Then automate the repetitive parts.",
      },
      {
        kind: "assignment",
        text: "Map one content process from topic to final draft. Mark which steps require human judgment and which steps are repetitive.",
      },
    ],
  },
  {
    id: 18,
    slug: "automation",
    title: "Full AI content automation",
    subtitle: "Build the system behind the content",
    minutes: 14,
    blocks: [
      {
        kind: "learn",
        items: [
          "Standardize your content brief.",
          "Create repeatable outputs.",
          "Add quality control.",
          "Design a scalable production pipeline.",
        ],
      },
      {
        kind: "h",
        text: "The automated flow",
      },
      {
        kind: "pipeline",
        items: [
          "Topic",
          "Idea",
          "Script",
          "Shot list",
          "Image prompts",
          "Images",
          "Video",
          "Voice",
          "Edit",
          "Caption",
          "Publishing",
        ],
      },
      {
        kind: "steps",
        items: [
          { title: "Standardize your brief", body: "Topic, audience, platform, duration, style and CTA." },
          { title: "Standardize the script", body: "Use a consistent script template: hook, body, button." },
          { title: "Standardize the shot list", body: "Use a repeatable shot-planning format: number, size, action, camera, duration." },
          { title: "Standardize the prompt blocks", body: "Reuse character, environment, camera and style sections." },
          { title: "Standardize the review", body: "Check story, identity, motion, audio, captions and branding." },
        ],
      },
      {
        kind: "list",
        title: "Brief template — copy this",
        items: [
          "Topic:",
          "Audience:",
          "Platform:",
          "Duration:",
          "Style:",
          "CTA:",
          "Must keep (identity, wardrobe, locations):",
          "Must avoid:",
        ],
      },
      {
        kind: "rule",
        title: "Automation principle",
        text: "Automation should reduce repetitive effort, not remove quality control. A system that produces bad content faster is still a bad system.",
      },
      {
        kind: "assignment",
        text: "Design an end-to-end workflow that begins with one topic and produces a complete short-form content package.",
      },
    ],
  },
  {
    id: 19,
    slug: "portfolio-brand",
    title: "Building your portfolio and creative brand",
    subtitle: "Show people what you can actually do",
    minutes: 12,
    blocks: [
      {
        kind: "learn",
        items: [
          "Select strong portfolio pieces.",
          "Show your process as well as the final result.",
          "Create case studies.",
          "Position yourself clearly.",
        ],
      },
      {
        kind: "p",
        text: "A portfolio is not every file on your drive. It is proof. Five strong pieces will hire you. Fifty average pieces will hide you.",
      },
      {
        kind: "steps",
        items: [
          { title: "Choose your best work", body: "Select projects that demonstrate different skills." },
          { title: "Show the process", body: "Include concept, prompt, reference, generation and final result." },
          { title: "Build a case study", body: "Explain objective, process, challenge, solution and outcome." },
          { title: "Write your positioning statement", body: "Say clearly what you create and who it is for." },
          { title: "Keep publishing", body: "Let your portfolio evolve with your skills." },
        ],
      },
      {
        kind: "list",
        title: "Case study skeleton",
        items: [
          "Objective: what was this piece supposed to do?",
          "Process: bible, prompts, frames, motion, edit.",
          "Challenge: what broke — identity, hands, motion, mix?",
          "Solution: the one change that fixed it.",
          "Outcome: the finished piece and what you would repeat.",
        ],
      },
      {
        kind: "rule",
        title: "Positioning example",
        text: "I create cinematic AI films and visual stories for brands and digital audiences.",
      },
      {
        kind: "list",
        title: "Write yours in this shape",
        items: [
          "I create [form] for [audience].",
          "Not: I use AI.",
          "Not: I can do anything.",
          "Yes: I create cinematic AI films and visual stories for brands and digital audiences.",
        ],
      },
      {
        kind: "assignment",
        text: "Build a five-project portfolio: one film, one advertisement, one dialogue scene, one social-media project and one experimental project.",
      },
    ],
  },
  {
    id: 20,
    slug: "thirty-day-roadmap",
    title: "Your 30-day AI creator roadmap",
    subtitle: "Turn knowledge into practice",
    minutes: 16,
    blocks: [
      {
        kind: "learn",
        items: [
          "Practice every stage of the workflow.",
          "Build a portfolio.",
          "Create a repeatable niche system.",
          "Move from creator to operator.",
        ],
      },
      {
        kind: "p",
        text: "Reading this book is not the work. The 30 days are the work. Tick each day in the Roadmap tab. Submit the prompts that matter in Studio so the author can rate them.",
      },
      {
        kind: "list",
        title: "Week 1 — Foundation",
        items: [
          "Day 1: Choose your niche. Write the one sentence.",
          "Day 2: Test image generators with the African king prompt.",
          "Day 3: Test video generators with the entrepreneur walk.",
          "Day 4: Create your first character bible.",
          "Day 5: Write your first short story — hook, problem, change, ending.",
          "Day 6: Generate your first images from that story.",
          "Day 7: Create your first video clip. One action.",
        ],
      },
      {
        kind: "list",
        title: "Week 2 — Storytelling",
        items: [
          "Day 8: Improve the script. Short sentences. Read it aloud.",
          "Day 9: Build the storyboard. One purpose per shot.",
          "Day 10: Lock character consistency across four locations.",
          "Day 11: Practice camera movements: static, push-in, track.",
          "Day 12: Create a multi-frame sequence, close to wide.",
          "Day 13: Animate the sequence with the continuity master prompt.",
          "Day 14: Add voice-over. Short. Clear. Human.",
        ],
      },
      {
        kind: "list",
        title: "Week 3 — Production",
        items: [
          "Day 15: Add sound effects. Ambience plus action.",
          "Day 16: Add music under the voice, not over it.",
          "Day 17: Edit in CapCut. Story first.",
          "Day 18: Add captions. Correct every word.",
          "Day 19: Add branding. End card or quiet mark.",
          "Day 20: Create a complete short film.",
          "Day 21: Publish it.",
        ],
      },
      {
        kind: "list",
        title: "Week 4 — Professional level",
        items: [
          "Day 22: Create an advertisement.",
          "Day 23: Create a dialogue scene.",
          "Day 24: Create a music visual.",
          "Day 25: Create an interactive video.",
          "Day 26: Build a content series.",
          "Day 27: Build your portfolio.",
          "Day 28: Create your repeatable workflow.",
          "Day 29: Design an automation system.",
          "Day 30: Review your progress and plan your next 30 days.",
        ],
      },
      {
        kind: "rule",
        title: "Final capstone",
        text: "Create one professional AI project from beginning to end. It must include a clear niche, idea, script, character bible, storyboard, at least six visual frames, AI video, voice or dialogue, sound effects, music, captions, branding and final export.",
      },
      {
        kind: "rule",
        title: "The creator principle",
        text: "AI is the tool. You are the creator. Tools change. Creative judgment, storytelling, direction, consistency and systems remain valuable.",
      },
      {
        kind: "assignment",
        text: "Follow the 30-day roadmap. Track each day in this academy. Finish the capstone before you call the course complete. Send your capstone prompts to the author from Studio.",
      },
    ],
  },
  {
    id: 21,
    slug: "final-word",
    title: "Final word",
    subtitle: "More creators. A brighter tomorrow.",
    minutes: 5,
    blocks: [
      {
        kind: "p",
        text: "You began with an idea. You learned how to turn that idea into a story, a frame, a video, a soundtrack and a finished piece of content. The next step is consistency.",
      },
      {
        kind: "p",
        text: "Use this book as a workbook, not simply something to read. Recreate the examples. Build your prompt library. Save your failures. Improve one variable at a time. Then build systems around what works.",
      },
      {
        kind: "p",
        text: "Greg walking the street, Daniel in four rooms, the Last Message at midnight, the fashion ad, the dialogue across a desk — none of those matter until you generate them, break them, and finish them.",
      },
      {
        kind: "rule",
        title: "The question",
        text: "Do not ask only, “What can AI make?” Ask, “What can I create with AI?”",
      },
      {
        kind: "p",
        text: "More creators. A brighter tomorrow.",
      },
    ],
  },
];

export const ROADMAP_DAYS: { day: number; week: string; task: string }[] = [
  { day: 1, week: "Foundation", task: "Choose your niche." },
  { day: 2, week: "Foundation", task: "Test image generators." },
  { day: 3, week: "Foundation", task: "Test video generators." },
  { day: 4, week: "Foundation", task: "Create your first character." },
  { day: 5, week: "Foundation", task: "Write your first short story." },
  { day: 6, week: "Foundation", task: "Generate your first images." },
  { day: 7, week: "Foundation", task: "Create your first video." },
  { day: 8, week: "Storytelling", task: "Improve the script." },
  { day: 9, week: "Storytelling", task: "Build the storyboard." },
  { day: 10, week: "Storytelling", task: "Lock character consistency." },
  { day: 11, week: "Storytelling", task: "Practice camera movements." },
  { day: 12, week: "Storytelling", task: "Create a multi-frame sequence." },
  { day: 13, week: "Storytelling", task: "Animate the sequence." },
  { day: 14, week: "Storytelling", task: "Add voice-over." },
  { day: 15, week: "Production", task: "Add sound effects." },
  { day: 16, week: "Production", task: "Add music." },
  { day: 17, week: "Production", task: "Edit in CapCut." },
  { day: 18, week: "Production", task: "Add captions." },
  { day: 19, week: "Production", task: "Add branding." },
  { day: 20, week: "Production", task: "Create a complete short film." },
  { day: 21, week: "Production", task: "Publish it." },
  { day: 22, week: "Professional", task: "Create an advertisement." },
  { day: 23, week: "Professional", task: "Create a dialogue scene." },
  { day: 24, week: "Professional", task: "Create a music visual." },
  { day: 25, week: "Professional", task: "Create an interactive video." },
  { day: 26, week: "Professional", task: "Build a content series." },
  { day: 27, week: "Professional", task: "Build your portfolio." },
  { day: 28, week: "Professional", task: "Create your repeatable workflow." },
  { day: 29, week: "Professional", task: "Design an automation system." },
  { day: 30, week: "Professional", task: "Review your progress and plan your next 30 days." },
];

export type LibraryPrompt = { id: string; chapter: number; title: string; text: string };

export const PROMPT_LIBRARY: LibraryPrompt[] = chapters.flatMap((ch) =>
  ch.blocks
    .filter((b): b is Extract<ContentBlock, { kind: "prompt" }> => b.kind === "prompt")
    .map((b, i) => ({
      id: `${ch.slug}-${i}`,
      chapter: ch.id,
      title: b.title,
      text: b.text,
    })),
);

export function chapterBySlug(slug: string) {
  return chapters.find((c) => c.slug === slug);
}

export function neighbors(slug: string) {
  const i = chapters.findIndex((c) => c.slug === slug);
  return {
    prev: i > 0 ? { slug: chapters[i - 1].slug, title: chapters[i - 1].title } : null,
    next:
      i >= 0 && i < chapters.length - 1
        ? { slug: chapters[i + 1].slug, title: chapters[i + 1].title }
        : null,
  };
}
