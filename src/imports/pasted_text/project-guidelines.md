=========================================================
ENGINEERING PRINCIPLES
=========================================================

This project must be developed as production-quality software.

Never sacrifice architecture for speed.

Prioritize:

• Readability
• Scalability
• Maintainability
• Performance
• Reusability
• Clean Code
• Modular Design

Avoid monolithic files.

Separate concerns clearly.

=========================================================
PROJECT STRUCTURE
=========================================================

Suggested folders:

src/

core/

render/

camera/

controls/

gestures/

physics/

magic/

particles/

environment/

worlds/

portal/

lighting/

materials/

postprocessing/

audio/

ui/

assets/

utils/

config/

workers/

shaders/

hooks/

debug/

=========================================================
IMPLEMENTATION ORDER
=========================================================

Build incrementally.

Phase 1

Renderer

Scene

Camera

Lights

Environment

Phase 2

Hand Tracking

Gesture Recognition

Gesture Smoothing

Gesture Confidence

Phase 3

Camera Controller

Interaction System

Object Selection

Telekinesis

Phase 4

Magic Engine

Portal System

Physics

Spell System

Phase 5

Particle Engine

GPU Instancing

Morphing

LOD

Performance Manager

Phase 6

Audio

UI

Post Processing

Loading Screen

Settings

Phase 7

Optimization

Debug Tools

Accessibility

Final Polish

=========================================================
CODING STYLE
=========================================================

Use descriptive names.

Avoid magic numbers.

Avoid duplicated logic.

Every module should have a single responsibility.

Prefer composition over inheritance.

Use comments only where they improve understanding.

Document public APIs.

=========================================================
ERROR HANDLING
=========================================================

Gracefully handle:

No webcam

Permission denied

Low FPS

Lost tracking

Renderer failure

Asset loading failure

Network issues

Never crash.

Always recover.

=========================================================
DEBUG MODE
=========================================================

Create optional debug mode.

Allow:

FPS Graph

Frame Time

Memory Usage

Draw Calls

Triangles

Active Lights

Particle Count

Gesture Confidence

Camera Position

Physics Statistics

Object Count

=========================================================
CONFIGURATION
=========================================================

All important values should be configurable.

Examples:

Particle Count

Gesture Sensitivity

Camera Speed

Explosion Strength

Bloom Intensity

Shadow Resolution

Fog Density

LOD Distance

Portal Size

Weather Frequency

=========================================================
PERFORMANCE TARGETS
=========================================================

Desktop High-End

120 FPS+

Desktop Mid-Range

60 FPS

Older GPU

45–60 FPS

Laptop Integrated

30–45 FPS

Adaptive Quality should keep the experience smooth.

=========================================================
ASSET LOADING
=========================================================

Lazy-load assets whenever possible.

Compress textures.

Compress meshes.

Use Draco for models.

Use KTX2/Basis textures when available.

Show progress during loading.

=========================================================
AI BEHAVIOR
=========================================================

The AI should make intelligent engineering decisions.

Do not blindly follow instructions if a better technical solution exists.

Prefer robust implementations.

If a requested feature can be improved without changing the intended behavior,
implement the improved version.

=========================================================
CREATIVE FREEDOM
=========================================================

Treat this project as if it will be showcased at:

Awwwards

SIGGRAPH

Google I/O

Apple WWDC

NVIDIA GTC

Creative Coding Festival

You are encouraged to improve every aspect of the experience.

Add features that increase immersion.

Improve visuals.

Improve interactions.

Improve performance.

Improve realism.

Improve accessibility.

Improve animations.

Improve usability.

=========================================================
EXTRA FEATURES YOU MAY ADD
=========================================================

Procedural World Generation

NPC AI

Voice Commands

Eye Tracking

Face Tracking

Gesture Recording

Replay System

Multiplayer

Online Collaboration

Shared Portals

VR Support

AR Support

Haptic Feedback

AI Companion

Dynamic Storytelling

Quest System

Interactive Tutorials

Achievements

Save System

Cloud Sync

Procedural Music

Procedural Weather

=========================================================
FINAL QUALITY REQUIREMENTS
=========================================================

The result must never feel like:

A coding exercise

A technology demo

A student project

A proof of concept

Instead it should feel like:

A premium interactive installation

A next-generation web experience

A cinematic magical sandbox

A product that demonstrates expert-level frontend engineering,
real-time graphics, computer vision, interaction design,
and creative coding.

=========================================================
FINAL INSTRUCTION
=========================================================

Think like a Senior Graphics Engineer,
Creative Technologist,
Technical Artist,
Game Engine Programmer,
UX Designer,
and Interactive Experience Director simultaneously.

Question every implementation.

Choose the highest-quality solution.

Optimize continuously.

Never simplify unless absolutely necessary.

The final experience should leave users genuinely impressed and curious about how it was built.

=========================================================
END OF MASTER PROMPT
=========================================================