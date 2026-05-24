# Event Horizon Gravitational Lensing Observatory

An interactive, browser-based astrophysics simulation that visualizes the gravitational lensing effects of a black hole. This tool utilizes general relativity principles and numerical integration to ray-trace photon trajectories, demonstrating how extreme gravity warps space-time and distorts background light.

## 🚀 Live Demo
Experience the real-time interactive simulation here: [https://github.io]([https://github.io](https://github.com/ChetanEpuri/EVENT-HORIZON))

---

## 🌌 Features & Controls

The simulator provides a real-time control interface to alter the fabric of the simulation and toggle visual overlays:

*   **Gravity & Relativity Parameters:**
    *   `Mass`: Adjusts the mass of the black hole singularity, altering its Schwarzschild radius.
    *   `Relativity Index`: Scales the strength of relativistic bending effects on light paths.
*   **Photon Physics Configuration:**
    *   `Speed (c)`: Controls the baseline speed of light within the canvas coordinate system.
    *   `Ray Count`: Changes the density of simulated light rays being cast.
    *   `Pixel Spacing`: Alters resolution scaling for rendering calculations.
    *   `Brightness`: Modulates the visual intensity of the light field overlays.
*   **Visual Structure Toggles:**
    *   `Space Grid`: Projects a coordinate grid warping under gravity.
    *   `Star Field`: Generates background stars to showcase lensing and Einstein rings.
    *   `Accretion Disc`: Renders the matter disk spinning around the event horizon.
    *   `Photon Trails`: Draws the historical trajectories of calculated photons.
    *   `Einstein Ring`: Highlights the optical rings formed by perfectly aligned background light.
*   **Live Telemetry Panel:**
    *   Tracks real-time statistics including photon capture/escape counts, maximum light deflection angles, Schwarzschild radius boundaries, and the absolute X/Y matrix position of the singularity.

---

## 🧮 Core Mathematics & Physics

### 1. Ray-Tracing via RK4 Integrator
Instead of relying on standard linear graphics, this simulation uses a **4th Order Runge-Kutta (RK4)** numerical solver. Light trajectories are calculated by solving ordinary differential equations (ODEs) derived from the geodesic equations of general relativity. 

The RK4 method calculates four increments ($k_1, k_2, k_3, k_4$) per time step to minimize computational drift, ensuring high-accuracy bending paths when photons pass near the photon sphere:
$$\frac{dy}{dx} = f(x, y)$$
$$y_{n+1} = y_n + \frac{h}{6}(k_1 + 2k_2 + 2k_3 + k_4)$$

### 2. Gravitational Lensing
As photons travel past the mass source, their path is deflected by an angle ($\theta$) proportional to the mass ($M$) and inversely proportional to the impact parameter ($b$):
$$\theta \approx \frac{4GM}{c^2b}$$
When a background light source aligns perfectly behind the black hole relative to the observer, the deflection distorts the point of light into a continuous circle known as an **Einstein Ring**.

---

## 🛠️ Technical Stack

*   **Language:** Pure JavaScript (ES6+)
*   **Rendering engine:** HTML5 Canvas API (Real-time pixel manipulation)
*   **Styling:** Modern, responsive CSS3 with a dark-mode obsidian aesthetic
*   **Deployment:** GitHub Pages

---

## 📦 Local Installation

To run this simulation locally on your machine without an internet connection:

1. Clone the repository:
   ```bash
   git clone https://github.com
   ```
2. Navigate into the project folder:
   ```bash
   cd EVENT-HORIZON
   ```
3. Launch the project:
   * Simply double-click the `index.html` file to open it in any modern browser.
   * Alternatively, serve it locally using Python:
     ```bash
     python -m http.server 8000
     ```
     Then navigate to `http://localhost:8000` in your web browser.

---

## 📄 License
This project is open-source and available under the MIT License.
