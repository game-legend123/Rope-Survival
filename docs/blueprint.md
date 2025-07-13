# **App Name**: Rope Survival

## Core Features:

- Score Display: Display a score counter at the top of the screen, updated in real-time to show survival time using 'Space Grotesk' font.
- Physics-based Rope Simulation: Use <canvas> to render the rope and ball, simulating physics with gravity, oscillation from mouse movement, and adjustable rope tension/length via mouse drag. Implement rope elasticity.
- Animated Saw Blade: Animate a rotating saw blade moving horizontally across the bottom, increasing speed over time, with complex movement patterns (zig-zag, sudden acceleration). Game ends upon ball-saw collision, triggering a game over animation (ball drop, screen shake, 'Bạn đã thất bại!' text).
- Adaptive Difficulty: Employ an AI tool to generate new saw movement patterns every 15 seconds, increasing difficulty linearly (e.g., Stage 1: steady horizontal, Stage 2: sudden direction changes, Stage 3: double speed). The AI tool decides on the difficulty and pattern.
- In-App Purchases – Extra Lives: Implement in-app purchases for extra lives. Display a popup on game over offering 'Mua thêm 1 mạng – 0.99 USD'. Use Stripe or Paddle for payment processing (client-side validation with token stored in localStorage). Limit of 3 extra lives per game.
- Cosmetic Rope Upgrades: Offer cosmetic rope skins (neon colors, fabric textures, metal). Skins can be purchased with points or IAP (1 skin: 0.99 USD, 5 skins: 3.99 USD). Store skin ID in localStorage (no server required).
- Ad Integration: Display non-intrusive ads after game over using AdMob Web SDK or a simple banner ad service. Reward players with one free life per ad view.

## Style Guidelines:

- Background: Dark gray (#222).
- Rope: Basic white; cosmetic skins are multi-colored.
- Saw Blade: Silver-gray with a red edge.
- Ball: Easily identifiable neon color.
- Font: 'Space Grotesk' for all text.
- Large font size for the score; medium size for instructions.
- Clear and distinct icons for shopping cart (🛒), settings (⚙️), and extra lives (❤️).
- Rope: Smooth swaying and subtle stretching.
- Saw Blade: Consistent rotation; slight zoom when near the ball.
- Ball: Bounces when the rope is taut.