<div align="center">

# PulseGrowth

### Growth kinetics and metabolic rate estimation for mammalian cell culture

<a href="https://ebalderasr.github.io/PulseGrowth/">
  <img src="icon-512.png" alt="PulseGrowth" width="120">
</a>

<br>

**[→ Open the live app](https://ebalderasr.github.io/PulseGrowth/)**

<br>

[![Stack](https://img.shields.io/badge/Stack-HTML_·_CSS_·_JavaScript-4A90D9?style=for-the-badge)]()
[![Focus](https://img.shields.io/badge/Focus-Growth_Kinetics_·_CHO-34C759?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](./LICENSE)
[![Part of](https://img.shields.io/badge/Part_of-Host_Cell_Lab_Suite-5856D6?style=for-the-badge)](https://github.com/ebalderasr)

</div>

---

## What is PulseGrowth?

PulseGrowth is a **browser-based kinetics calculator** for mammalian cell culture. It converts routine two-point sampling data into the growth and metabolic metrics needed for passaging decisions, clone comparisons, and feeding corrections.

The app is organized into three modules: growth kinetics (μ, doubling time, IVCD), specific metabolite consumption rates (qGlc, qGln), and a simple feed correction estimator. All three are designed for quick bench-side use during culture operations.

No installation. No server. Runs entirely in the browser.

---

## Why it matters

Routine culture monitoring generates two data points at every sampling: a cell count and a set of metabolite concentrations. Extracting actionable metrics from those points — growth rate, doubling time, specific consumption rates — requires several non-trivial calculations that are error-prone to do by hand. Without a dedicated tool:

- μ and doubling time must be derived manually from a logarithmic expression
- Specific rates require IVCD normalization, which is rarely computed at the bench
- Unit conversions (g/L → mM) are applied inconsistently, making q values incomparable across runs
- Feed correction volumes must be calculated separately from a different formula

PulseGrowth covers all three steps in one interface, with consistent unit handling throughout.

---

## How it works

### Module 1 — Bio-Kinetics

Enter X₀, X₁, and Δt (in hours or days). PulseGrowth returns:

- Specific growth rate (μ)
- Doubling time (t_d)
- Expansion factor (X₁ / X₀)
- IVCD (exponential approximation, for downstream q calculations)

### Module 2 — Metabolics (q)

Enter glucose and/or glutamine concentrations as C₀ → C₁, selecting g/L or mM. The app converts g/L to mM internally using fixed molecular weights (Glc = 180.156 g/mol, Gln = 146.145 g/mol), then normalizes the concentration change by IVCD:

- qGlc — specific glucose consumption (pmol/cell/day)
- qGln — specific glutamine consumption (pmol/cell/day)

A positive q means net consumption (C₀ > C₁). Entering values in g/L or mM produces equivalent results because units are normalized before computing.

### Module 3 — Feed Control

Enter culture volume, stock concentration, current concentration, and target concentration. PulseGrowth returns the feed volume required to restore the target level in a single addition. Intended as a quick operational estimate, not a full dynamic feeding model.

---

## Methods

### Exponential growth model

$$\mu = \frac{\ln(X_1 / X_0)}{\Delta t} \qquad t_d = \frac{\ln 2}{\mu} \qquad \text{Expansion} = \frac{X_1}{X_0}$$

### IVCD (exponential approximation between two points)

$$IVCD = \left(\frac{X_1 - X_0}{\ln(X_1/X_0)}\right) \Delta t$$

### Specific metabolite consumption rate

$$q = \frac{\Delta C}{IVCD} \times 24$$

where ΔC = C₀ − C₁ in mM, IVCD in 10⁶ cells·h/mL, and the factor 24 converts from per-hour to per-day.

### Feed correction (single addition)

$$V_{feed} = \frac{(C_{target} - C_{current}) \times V_{culture}}{C_{stock} - C_{target}}$$

---

## Features

| | |
|---|---|
| **Growth kinetics** | Computes μ, doubling time, expansion factor, and IVCD from two sampling points |
| **IVCD-normalized q** | qGlc and qGln estimated using exponential IVCD for consistent inter-run comparison |
| **Unit-aware metabolite inputs** | Accepts g/L or mM; converts internally before computing q |
| **Feed correction estimator** | Single-addition feed volume for glucose and glutamine correction |
| **Flexible time input** | Manual Δt or start/end datetime |
| **Offline-first PWA** | Service Worker caches all assets; works without internet after first load |
| **Bilingual UI** | Full Spanish / English interface |
| **No installation** | Opens instantly in any modern browser; installable on Android, iOS, and desktop |

---

## Tech stack

**Frontend**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

**Deployment**

![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222222?style=flat-square&logo=github&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=flat-square&logo=pwa&logoColor=white)

Fully static — no backend, no framework, no build step.

---

## Project structure

```
PulseGrowth/
├── index.html              ← markup only
├── manifest.json           ← PWA manifest
├── sw.js                   ← Service Worker (cache-first, offline support)
├── icon-192.png
├── icon-512.png
├── icon-maskable-192.png
└── icon-maskable-512.png
```

---

## Author

**Emiliano Balderas Ramírez**
Bioengineer · PhD Candidate in Biochemical Sciences
Instituto de Biotecnología (IBt), UNAM

[![LinkedIn](https://img.shields.io/badge/LinkedIn-emilianobalderas-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/emilianobalderas/)
[![Email](https://img.shields.io/badge/Email-ebalderas%40live.com.mx-D14836?style=flat-square&logo=gmail&logoColor=white)](mailto:ebalderas@live.com.mx)

---

## Related

[**CellSplit**](https://github.com/ebalderasr/CellSplit) — Neubauer cell counting and passage planning for CHO cultures.

[**Kinetic Drive**](https://github.com/ebalderasr/Kinetic-Drive) — interactive kinetic analysis for mammalian cell culture data.

[**Clonalyzer 2**](https://github.com/ebalderasr/Clonalyzer-2) — fed-batch kinetics analysis with clone comparisons and publication-ready plots.

[**CellBlock**](https://github.com/ebalderasr/CellBlock) — shared biosafety cabinet scheduling for cell culture research groups.

---

<div align="center"><i>PulseGrowth — two sampling points, full kinetic picture.</i></div>
