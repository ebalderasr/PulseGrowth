# 🛰️ PulseGrowth | Host Cell Lab Suite
> **Growth kinetics and process timing. Fast, clear, and lab-ready.**

PulseGrowth is a lightweight web app for analyzing **cell growth kinetics** and estimating **process timing** in mammalian cell culture workflows.  
It is part of **Host Cell**, a growing suite of practical laboratory and bioprocess tools built by **Emiliano Balderas** (IBt-UNAM).

<p align="center">
  <img src="icon-512.png" width="180" alt="PulseGrowth Logo">
</p>

<p align="center">
  <a href="https://ebalderasr.github.io/PulseGrowth/">
    <img src="https://img.shields.io/badge/🚀_Launch_Live_App-PulseGrowth-007bff?style=for-the-badge&labelColor=000000" alt="Launch PulseGrowth App">
  </a>
</p>

<p align="center">
  <a href="https://github.com/ebalderasr/PulseGrowth">Repo</a> •
  <a href="https://ebalderasr.github.io/PulseGrowth/">Live App</a>
</p>

---

## What is PulseGrowth?

**PulseGrowth** helps convert routine sampling data into actionable bioprocess metrics for mammalian cell culture.

The app is organized into three practical modules:

- **Bio-Kinetics**: calculates growth metrics from two sampling points
- **Metabolics (q)**: estimates **qGlc** and **qGln** normalized by IVCD
- **Feed Control**: estimates simple feed additions to restore target concentrations

It is designed for quick bench-side calculations, passaging decisions, and culture monitoring.

---

## 🧬 Scientific Fundamentals

PulseGrowth uses an **exponential growth model** between two sampling points:

$$X = X_0 \cdot e^{\mu t}$$

### Variable definitions
- **X0**: initial viable cell density (typically in **×10⁶ cell/mL**)
- **X1**: final viable cell density (typically in **×10⁶ cell/mL**)
- **Δt**: elapsed time between measurements
- **μ**: specific growth rate

### Core growth calculations
PulseGrowth calculates:

$$\mu = \frac{\ln(X_1/X_0)}{\Delta t}$$

$$t_d = \frac{\ln(2)}{\mu}$$

$$\text{Expansion factor} = \frac{X_1}{X_0}$$

### IVCD (exponential approximation)
To normalize metabolite consumption rates, PulseGrowth estimates **Integrated Viable Cell Density (IVCD)** as:

$$IVCD = \left(\frac{X_1 - X_0}{\ln(X_1/X_0)}\right)\Delta t$$

This is useful for obtaining more comparable **specific rates (q)** than using only initial or final cell density.

---

## ✅ Calculation Logic (How PulseGrowth computes results)

This section explains **exactly how the app performs the calculations**.

### 1) Bio-Kinetics module
Given **X0**, **X1**, and **Δt**:
1. Convert **Δt** to a common internal time basis (hours, if needed)
2. Compute **μ** using the exponential growth equation
3. Compute **doubling time** from μ
4. Compute **expansion factor = X1/X0**
5. Compute **IVCD** for downstream q calculations

### 2) Metabolics module (qGlc / qGln)
PulseGrowth estimates specific metabolite rates using concentration change normalized by IVCD.

#### Step A: Normalize concentration units
If the user enters metabolite concentrations in **g/L**, the app converts them internally to **mM** using molecular weight (MW):

$$mM = \frac{g/L}{MW\ (g/mol)} \times 1000$$

Default MW values used:
- **Glucose (Glc)** = **180.156 g/mol**
- **Glutamine (Gln)** = **146.145 g/mol**

If the user enters values directly in **mM**, no conversion is needed.

#### Step B: Compute concentration change
For each metabolite:

$$\Delta C = C_0 - C_1$$

Where:
- **C0** = initial concentration
- **C1** = final concentration

Positive **ΔC** means net consumption.

#### Step C: Compute specific rate (q)
PulseGrowth reports q values consistently in **pmol/cell/day**:

$$q = \left(\frac{\Delta C}{IVCD}\right)\times 24$$

Where:
- **ΔC** is in **mM**
- **IVCD** is in **(10^6\ cell\cdot h)/mL**
- The factor **24** converts from per-hour to per-day basis

### 3) Feed Control module (simple correction estimate)
PulseGrowth estimates the feed volume required to adjust a metabolite concentration from current to target level using a single-addition correction formula.

For a feed stock concentration **Cstock**, current concentration **Ccurrent**, target concentration **Ctarget**, and culture volume **Vculture**:

$$V_{feed} = \frac{(C_{target}-C_{current})V_{culture}}{C_{stock}-C_{target}}$$

This is a **simple algebraic planner** for practical lab use, not a full dynamic feeding model.

---

## ✅ Unit Logic (Important)

PulseGrowth uses a unit strategy designed for **consistency and comparability**.

### Cell density inputs
- Expected in **×10⁶ cell/mL**

### Time inputs
- **hours** or **days**
- Internally normalized for growth-rate calculations

### Metabolite concentration inputs
- **g/L** or **mM** (for Glc / Gln)

### q outputs
- Primary output: **pmol/cell/day**
- Optional display: **pg/cell/day** (mass-equivalent reference)

### Correct use rule
PulseGrowth ensures q outputs are comparable by converting **g/L → mM** internally before calculation.

✅ This means:
- entering glucose as **6 → 4 g/L**
- or entering equivalent values in **mM**

...will produce comparable **qGlc** values (aside from rounding), because the app normalizes units before computing q.

---

## ⚡ Features

- **Growth Kinetics Solver:** Calculates **μ**, **doubling time**, and **expansion factor**
- **IVCD-Based q Estimation:** qGlc / qGln normalized using exponential IVCD approximation
- **Unit-Aware Metabolite Inputs:** Accepts **g/L** or **mM** and converts internally
- **Simple Feed Planner:** Quick feed-volume estimates for glucose and glutamine correction
- **Time Input Flexibility:** Manual Δt or start/end datetime input
- **Mobile-First UI:** High-contrast, telemetry-inspired interface for real lab use
- **PWA Ready:** Installable on Android/iOS and usable offline after first load
- **Host Cell Design System:** Visual consistency with other tools in the suite

---

## 🔬 Typical Use Cases

PulseGrowth is useful for:
- estimating whether a culture is still in **exponential growth**
- comparing growth performance across clones or conditions
- calculating **doubling time** for passaging planning
- estimating **qGlc** and **qGln** from routine sampling data
- planning simple corrective feeds for glucose/glutamine
- reducing manual calculator/transcription errors during culture operations

---

## 🚀 How to Use

### Bio-Kinetics
1. Enter **X0**, **X1**, and **Δt**
2. Select time unit (**h** or **day**)
3. Click **Analyze kinetics**
4. Review **μ**, **t_d**, **expansion factor**, and **IVCD**

### Metabolics (q)
1. Enter Glc and/or Gln concentrations as **C0 → C1**
2. Select units (**g/L** or **mM**)
3. Click **Calculate q**
4. Review **qGlc** and **qGln** in **pmol/cell/day**

### Feed Control
1. Enter culture volume
2. Enter stock concentrations and target concentrations
3. Click **Calculate feed plan**
4. Review estimated feed volumes

---

## 📱 Installation (PWA)

PulseGrowth can be installed as a Progressive Web App (PWA) for faster access and offline use.

### Android / Desktop (Chrome, Edge)
- Open the live app
- Tap/click **Install App** (if shown)
- Or use the browser install prompt/menu

### iPhone / iPad (Safari)
- Open the live app
- Tap **Share**
- Select **Add to Home Screen**

Once installed, the app can work offline after the required files are cached.

---

## ❓ FAQ

**Q: Why does PulseGrowth convert g/L to mM for q calculations?**  
**A:** Because q should be comparable across inputs. Concentration changes in **g/L** and **mM** are not directly equivalent without using molecular weight (MW). PulseGrowth converts to **mM** internally before computing q.

**Q: What does a positive q mean?**  
**A:** By convention in PulseGrowth, **q > 0** means **net consumption** (C0 > C1). Negative q means the metabolite increased over time (net accumulation/production).

**Q: Is IVCD exact?**  
**A:** No. The app uses an **exponential approximation** of IVCD between two sampling points. It is practical and useful for routine comparisons, but still depends on the underlying growth behavior and data quality.

**Q: Does this replace process models or SOPs?**  
**A:** No. PulseGrowth is a **calculation aid** for rapid workflow support. Always validate decisions against SOPs, process knowledge, and experimental context.

---

## ⚠️ Notes and Limitations

* PulseGrowth is a **calculation aid**, not a substitute for SOPs or experimental judgment.
* Exponential assumptions may not hold if the culture is in lag/stationary/decline phase.
* IVCD is an approximation based on two sampling points.
* Feed calculations are simplified and intended for quick operational estimates.
* Always verify:
  * units and concentration basis
  * sampling times
  * viable cell count quality / counting consistency
  * stock solution identity and concentration
* For critical workflows, follow institutional protocols and lab-specific validation practices.

---

## 👨‍🔬 Author

**Emiliano Balderas**  
Biotechnology Engineer | PhD Student in Biochemistry  
*Instituto de Biotecnología (IBt) - UNAM*

---

## 🧩 About Host Cell

**Host Cell** is a growing suite of practical lab and bioprocess tools focused on:

* clarity
* speed
* reproducibility
* real-world usability at the bench

PulseGrowth is one module in that ecosystem.

---

**Host Cell Lab Suite** – *Practical tools for high-performance biotechnology.*