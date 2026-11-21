import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  Activity, AlertTriangle, Box, Building2, Camera, ChevronLeft, ChevronRight, Compass, Eye, Factory, Info, Layers, MapPin, Moon,
  Pause, Play, RefreshCw, RotateCcw, RotateCw, Scale, ShieldCheck, Sun, Truck, Users, Warehouse, X, Zap
} from 'lucide-react'

const fmt = (v) => Number(v || 0).toLocaleString('en-IN')
const money = (v) => '₹' + Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
const pct = (v) => `${Number(v || 0).toFixed(1)}%`

const RISK_COLORS = {
  CRITICAL: 0xdc2626,
  HIGH: 0xea580c,
  MEDIUM: 0xd97706,
  LOW: 0x16a34a,
}

const CARRIER_COLORS = {
  DHL: { cab: 0xd97706, trailer: 0xfacc15, text: '#dc2626', name: 'DHL Express' },
  BlueDart: { cab: 0x1e3a8a, trailer: 0x0284c7, text: '#ffffff', name: 'BlueDart' },
  Delhivery: { cab: 0x1e293b, trailer: 0xdc2626, text: '#ffffff', name: 'Delhivery' },
  TCI: { cab: 0x0f766e, trailer: 0x0d9488, text: '#ffffff', name: 'TCI Freight' },
  DEFAULT: { cab: 0x334155, trailer: 0x0ea5e9, text: '#ffffff', name: 'Logistics Fleet' },
}

/* ==================== PROCEDURAL HIGH-RESOLUTION TEXTURE GENERATORS ==================== */

// 1. High-Precision Architectural Metal Cladding (Kingspan / Tata BlueScope Profile with PBR Ribs & Highlights)
function createCorrugatedTexture(baseHex = '#1e293b', ribHex = '#334155') {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = baseHex
  ctx.fillRect(0, 0, 256, 256)

  // Architectural composite micro-ribs with specular highlight and ambient crevice
  for (let x = 0; x < 256; x += 16) {
    // Crevice shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
    ctx.fillRect(x, 0, 2, 256)
    // Panel flat face
    ctx.fillStyle = ribHex
    ctx.fillRect(x + 2, 0, 10, 256)
    // Specular highlight edge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)'
    ctx.fillRect(x + 2, 0, 1.5, 256)
    // Fastener rivets every 64px
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    for (let y = 32; y < 256; y += 64) {
      ctx.fillRect(x + 6, y, 2, 2)
    }
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(6, 3)
  return tex
}

// 2. Heavy Industrial Concrete Yard Floor (Expansion Joint Bays, Surface Grain & Tonal Variation)
function createConcreteYardTexture(isDark = false) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Base concrete tone
  ctx.fillStyle = isDark ? '#111827' : '#e2e8f0'
  ctx.fillRect(0, 0, 512, 512)

  // Subtle concrete aggregate noise
  const imgData = ctx.getImageData(0, 0, 512, 512)
  const d = imgData.data
  for (let i = 0; i < d.length; i += 4) {
    const noise = (Math.random() - 0.5) * 14
    d[i] = Math.min(255, Math.max(0, d[i] + noise))
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + noise))
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + noise))
  }
  ctx.putImageData(imgData, 0, 0)

  // 64px expansion joint grid lines (6m x 6m scale)
  ctx.strokeStyle = isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(71, 85, 105, 0.45)'
  ctx.lineWidth = 2
  for (let p = 0; p <= 512; p += 64) {
    ctx.beginPath()
    ctx.moveTo(p, 0)
    ctx.lineTo(p, 512)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, p)
    ctx.lineTo(512, p)
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(12, 8)
  return tex
}

// 3. Dense Asphalt Highway & Internal Corridor (Aggregates, Painted Lanes & Wear)
function createAsphaltRoadTexture(isDark = false) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  // Deep dark asphalt matrix
  ctx.fillStyle = isDark ? '#090d16' : '#1e293b'
  ctx.fillRect(0, 0, 512, 256)

  // Fine aggregate texture
  const imgData = ctx.getImageData(0, 0, 512, 256)
  const d = imgData.data
  for (let i = 0; i < d.length; i += 4) {
    const speckle = (Math.random() - 0.5) * 18
    d[i] = Math.min(255, Math.max(0, d[i] + speckle))
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + speckle))
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + speckle))
  }
  ctx.putImageData(imgData, 0, 0)

  // White edge safety lane lines
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 16, 512, 5)
  ctx.fillRect(0, 235, 512, 5)

  // Double yellow centerline highway division
  ctx.fillStyle = '#eab308'
  ctx.fillRect(0, 122, 512, 4)
  ctx.fillRect(0, 130, 512, 4)

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(8, 1)
  return tex
}

// 4. Modern Photovoltaic Solar Panel Texture
function createSolarPanelTexture(isDark = false) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = isDark ? '#0b132b' : '#1e3a8a'
  ctx.fillRect(0, 0, 256, 256)

  // Photovoltaic silicon cell grid with silver busbars
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
  ctx.lineWidth = 1
  for (let x = 0; x <= 256; x += 42) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 256)
    ctx.stroke()
  }
  for (let y = 0; y <= 256; y += 42) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(256, y)
    ctx.stroke()
  }

  // Thin silver grid fingers
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.lineWidth = 0.5
  for (let y = 0; y <= 256; y += 6) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(256, y)
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(canvas)
  return tex
}

// 5. Yellow & Black Hazard Safety Stripes
function createHazardTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#facc15'
  ctx.fillRect(0, 0, 128, 128)
  ctx.fillStyle = '#0f172a'
  for (let i = -128; i < 256; i += 32) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + 16, 0)
    ctx.lineTo(i + 16 + 128, 128)
    ctx.lineTo(i + 128, 128)
    ctx.closePath()
    ctx.fill()
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(6, 1)
  return tex
}

// 3. Commercial Trailer Side Texture with Brand Logo & Ribs
function createTrailerSideTexture(carrierKey, riskLevel) {
  const cInfo = CARRIER_COLORS[carrierKey] || CARRIER_COLORS.DEFAULT
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')

  // Base background
  ctx.fillStyle = carrierKey === 'DHL' ? '#facc15' : carrierKey === 'Delhivery' ? '#f8fafc' : '#ffffff'
  ctx.fillRect(0, 0, 512, 128)

  // Corrugated vertical panel lines
  ctx.fillStyle = 'rgba(0,0,0,0.06)'
  for (let x = 0; x < 512; x += 12) {
    ctx.fillRect(x, 0, 2, 128)
  }

  // Top and bottom frame rails
  ctx.fillStyle = '#475569'
  ctx.fillRect(0, 0, 512, 8)
  ctx.fillRect(0, 120, 512, 8)

  // DOT red/white reflective tape along bottom
  for (let x = 0; x < 512; x += 32) {
    ctx.fillStyle = '#dc2626'
    ctx.fillRect(x, 114, 16, 6)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x + 16, 114, 16, 6)
  }

  // Carrier Logo / Name
  ctx.fillStyle = cInfo.text
  ctx.font = '800 36px Montserrat, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(cInfo.name.toUpperCase(), 256, 68)

  // Subtitle / Fleet code
  ctx.font = '700 15px Montserrat, sans-serif'
  ctx.fillStyle = '#475569'
  ctx.fillText(`LOGISTICS FLEET · 32FT INTERMODAL · ${riskLevel || 'NORMAL'}`, 256, 96)

  const tex = new THREE.CanvasTexture(canvas)
  return tex
}

// 4. Dynamic Digital LED Scale Display
function makeDynamicScaleDisplay() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 144
  const ctx = canvas.getContext('2d')
  const tex = new THREE.CanvasTexture(canvas)

  const draw = (line1, line2, color = '#2dd4bf') => {
    ctx.fillStyle = '#090d16'
    ctx.fillRect(0, 0, 512, 144)
    ctx.strokeStyle = color
    ctx.lineWidth = 6
    ctx.strokeRect(4, 4, 504, 136)
    ctx.fillStyle = color
    ctx.font = '800 32px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(line1, 256, 56)
    ctx.fillStyle = '#f8fafc'
    ctx.font = '700 24px monospace'
    ctx.fillText(line2, 256, 108)
    tex.needsUpdate = true
  }

  draw('WB-01 SCALE ACTIVE', 'WAITING VEHICLE ENTRY', '#38bdf8')
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 2.0),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
  )
  return { mesh, draw }
}

// 5. Billboard / Signboard generator
function makeSignBoard(text, subtext, bgHex = '#0f172a', accentHex = '#14b8a6', width = 18.0, height = 2.8) {
  const canvas = document.createElement('canvas')
  canvas.width = 900
  canvas.height = 140
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = bgHex
  ctx.fillRect(0, 0, 900, 140)
  ctx.strokeStyle = accentHex
  ctx.lineWidth = 6
  ctx.strokeRect(4, 4, 892, 132)

  ctx.fillStyle = '#ffffff'
  ctx.font = '800 32px Montserrat, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(text, 450, 60)

  ctx.fillStyle = accentHex
  ctx.font = '700 20px Montserrat, sans-serif'
  ctx.fillText(subtext, 450, 104)

  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
  )
}

// 6. Label Sprite for Campus Landmarks
function makeLabelSprite(title, subtitle, isDark) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.96)'
  ctx.strokeStyle = isDark ? '#14b8a6' : '#0284c7'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.roundRect(6, 6, 500, 116, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = isDark ? '#2dd4bf' : '#0f172a'
  ctx.font = '800 24px Montserrat, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(title, 256, 50)

  ctx.fillStyle = isDark ? '#cbd5e1' : '#475569'
  ctx.font = '600 18px Montserrat, sans-serif'
  ctx.fillText(subtitle, 256, 90)

  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(9.0, 2.2, 1)
  return sprite
}

/* ==================== REALISTIC CLASS-8 SEMI-TRUCK BUILDER ==================== */
function buildRealisticSemiTruck(v, isDark = false) {
  const group = new THREE.Group()
  const cInfo = CARRIER_COLORS[v?.carrier] || CARRIER_COLORS.DEFAULT
  const riskColor = RISK_COLORS[v?.risk_level] || 0x0ea5e9

  // Materials
  const matCab = new THREE.MeshStandardMaterial({
    color: cInfo.cab,
    metalness: 0.35,
    roughness: 0.25,
  })
  const matChassis = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.6,
    roughness: 0.45,
  })
  const matChrome = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.92,
    roughness: 0.08,
  })
  const matRubber = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.9,
  })
  const matGlass = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.35,
    roughness: 0.05,
    metalness: 0.1,
  })

  // Dimensions
  const is32Ft = v?.vehicle_type === '32FT_TRUCK' || !v?.vehicle_type
  const trailerLen = is32Ft ? 5.2 : 3.8
  const trailerWidth = 1.6
  const trailerHeight = 2.1

  // 1. CHASSIS RAILS (Twin steel I-beams)
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(trailerLen + 2.0, 0.22, 1.1), matChassis)
  chassis.position.set(-0.2, 0.45, 0)
  group.add(chassis)

  // 2. TRACTOR CABIN (Aerodynamic Class-8 Sleeper Cab)
  const cabLen = 1.8
  const cabWidth = 1.5
  const cabHeight = 1.9

  // Main cab body
  const cab = new THREE.Mesh(new THREE.BoxGeometry(cabLen, cabHeight, cabWidth), matCab)
  cab.position.set(trailerLen / 2 + cabLen / 2 + 0.15, 1.35, 0)
  cab.castShadow = true

  // Front Radiator Grille (Chrome with horizontal slats)
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 1.1), matChrome)
  grille.position.set(trailerLen / 2 + cabLen + 0.16, 1.05, 0)

  // Front Heavy Bumper
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 1.56), matChrome)
  bumper.position.set(trailerLen / 2 + cabLen + 0.18, 0.48, 0)

  // Windshield (Curved appearance with tinted glass)
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 1.3), matGlass)
  windshield.position.set(trailerLen / 2 + cabLen + 0.16, 1.75, 0)

  // Sun Visor over Windshield
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 1.4), matCab)
  visor.position.set(trailerLen / 2 + cabLen + 0.1, 2.15, 0)

  // Dual Chrome Vertical Exhaust Stacks
  ;[-0.68, 0.68].forEach(sz => {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.1, 12), matChrome)
    pipe.position.set(trailerLen / 2 + 0.4, 1.85, sz)
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.2, 12), matChassis)
    shield.position.set(trailerLen / 2 + 0.4, 1.35, sz)
    group.add(pipe, shield)
  })

  // Cylindrical Chrome Fuel Tanks with Mounting Brackets
  ;[-0.72, 0.72].forEach(tz => {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 1.1, 14), matChrome)
    tank.rotation.z = Math.PI / 2
    tank.position.set(trailerLen / 2 + 0.6, 0.45, tz)
    group.add(tank)
  })

  // Headlights & Red Taillights
  ;[-0.55, 0.55].forEach(lz => {
    const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.22), new THREE.MeshBasicMaterial({ color: 0xfef08a }))
    headlight.position.set(trailerLen / 2 + cabLen + 0.22, 0.55, lz)
    const taillight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.2), new THREE.MeshBasicMaterial({ color: 0xef4444 }))
    taillight.position.set(-trailerLen / 2 - 0.22, 0.65, lz)
    group.add(headlight, taillight)
  })

  group.add(cab, grille, bumper, windshield, visor)

  // 3. COMMERCIAL SHIPPING TRAILER WITH CORRUGATED PANELS & BRAND LOGO
  const trailerTexture = createTrailerSideTexture(v?.carrier, v?.risk_level)
  const matTrailerSide = new THREE.MeshStandardMaterial({
    map: trailerTexture,
    metalness: 0.25,
    roughness: 0.4,
  })
  const matTrailerPlain = new THREE.MeshStandardMaterial({
    color: cInfo.trailer,
    metalness: 0.2,
    roughness: 0.45,
  })

  // Trailer body
  const trailerMaterials = [
    matTrailerPlain, // right
    matTrailerPlain, // left
    matTrailerPlain, // top
    matChassis,      // bottom
    matTrailerSide,  // front
    matTrailerSide,  // back
  ]
  const trailer = new THREE.Mesh(new THREE.BoxGeometry(trailerLen, trailerHeight, trailerWidth), trailerMaterials)
  trailer.position.set(0, 1.62, 0)
  trailer.castShadow = true
  group.add(trailer)

  // Trailer side skirts (Aerodynamic bottom skirts)
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(trailerLen * 0.7, 0.38, trailerWidth + 0.04), matChassis)
  skirt.position.set(-0.2, 0.55, 0)
  group.add(skirt)

  // 4. MULTI-AXLE WHEELS & TIRES (Cab Steer + Cab Drive + Trailer Dual Bogie)
  const wheelGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.26, 16)
  const hubGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.28, 8)
  const wheelMeshes = []

  // Wheel positions: Trailer rear dual axles, Cab drive axle, Cab front steer axle
  const wheelXPositions = [
    -trailerLen / 2 + 0.6,  // Trailer rear axle 1
    -trailerLen / 2 + 1.5,  // Trailer rear axle 2
    trailerLen / 2 + 0.5,   // Cab drive axle
    trailerLen / 2 + cabLen + 0.1, // Cab steer axle
  ]

  wheelXPositions.forEach(wx => {
    ;[-0.78, 0.78].forEach(wz => {
      const wGroup = new THREE.Group()
      const tire = new THREE.Mesh(wheelGeom, matRubber)
      tire.rotation.x = Math.PI / 2
      tire.castShadow = true
      const hub = new THREE.Mesh(hubGeom, matChrome)
      hub.rotation.x = Math.PI / 2
      wGroup.add(tire, hub)
      wGroup.position.set(wx, 0.38, wz)
      group.add(wGroup)
      wheelMeshes.push(wGroup)
    })
  })

  // 5. STATUS BEACON ON ROOF FOR CRITICAL VEHICLES
  if (v?.risk_level === 'CRITICAL' || v?.shipment_status === 'DELAYED') {
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.22, 10), new THREE.MeshBasicMaterial({ color: 0xff1111 }))
    beacon.position.set(trailerLen / 2 + cabLen / 2 + 0.15, 2.45, 0)
    group.add(beacon)
    group.userData.beacon = beacon
  }

  // Hitbox for raycasting
  const hitbox = new THREE.Mesh(new THREE.BoxGeometry(trailerLen + cabLen + 0.4, 3.2, 2.4), new THREE.MeshBasicMaterial({ visible: false }))
  hitbox.position.set(0.4, 1.6, 0)
  hitbox.userData = { pickable: true, kind: 'vehicle', data: v }
  group.add(hitbox)

  group.userData.wheelMeshes = wheelMeshes
  return { group, hitbox }
}

/* ==================== 10-WHEEL HEAVY LORRY (TAURUS 25T / INDIAN HEAVY HAULAGE) ==================== */
function build10WheelLorry(v, isDark = false) {
  const group = new THREE.Group()
  const cInfo = CARRIER_COLORS[v?.carrier] || CARRIER_COLORS.DEFAULT

  const matCab = new THREE.MeshStandardMaterial({
    color: cInfo.cab,
    metalness: 0.35,
    roughness: 0.28,
  })
  const matChassis = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.65,
    roughness: 0.45,
  })
  const matBody = new THREE.MeshStandardMaterial({
    color: cInfo.trailer,
    metalness: 0.25,
    roughness: 0.45,
  })
  const matTarp = new THREE.MeshStandardMaterial({
    color: 0x15803d, // heavy green tarpaulin
    roughness: 0.85,
  })
  const matChrome = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.92,
    roughness: 0.08,
  })
  const matRubber = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.9,
  })
  const matGlass = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.38,
    roughness: 0.05,
    metalness: 0.1,
  })

  const bodyLen = 5.2
  const bodyWidth = 1.6
  const bodyHeight = 1.85
  const cabLen = 1.6
  const cabWidth = 1.55
  const cabHeight = 1.85

  // 1. Heavy Rigid Chassis (Dual steel I-beams running full vehicle length)
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(bodyLen + cabLen + 0.3, 0.24, 1.1), matChassis)
  chassis.position.set(0.1, 0.46, 0)
  group.add(chassis)

  // 2. Heavy-Duty Forward Control Cab
  const cabX = bodyLen / 2 + cabLen / 2 - 0.1
  const cab = new THREE.Mesh(new THREE.BoxGeometry(cabLen, cabHeight, cabWidth), matCab)
  cab.position.set(cabX, 1.4, 0)
  cab.castShadow = true

  // Front Radiator Grille with chrome horizontal slats
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 1.1), matChrome)
  grille.position.set(cabX + cabLen / 2 + 0.05, 1.05, 0)

  // Indian Heavy Bull Bar / Front Crash Guard with amber fog lights
  const bullBar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 1.6), matChrome)
  bullBar.position.set(cabX + cabLen / 2 + 0.12, 0.58, 0)

  // Windshield
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.65, 1.35), matGlass)
  windshield.position.set(cabX + cabLen / 2 + 0.04, 1.8, 0)

  // Sun Visor / Overhang
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 1.45), matCab)
  visor.position.set(cabX + cabLen / 2 - 0.02, 2.2, 0)

  // Air Horns & Roof Luggage Rack
  const horn1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.5, 8), matChrome)
  horn1.rotation.z = Math.PI / 2
  horn1.position.set(cabX, 2.38, -0.45)
  const horn2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.5, 8), matChrome)
  horn2.rotation.z = Math.PI / 2
  horn2.position.set(cabX, 2.38, 0.45)

  // Vertical Chrome Exhaust Stack behind cab
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 10), matChrome)
  exhaust.position.set(cabX - cabLen / 2 - 0.1, 1.9, 0.65)

  group.add(cab, grille, bullBar, windshield, visor, horn1, horn2, exhaust)

  // 3. High-Sided Slatted Cargo Body with Tarp Roof
  const sideTex = createTrailerSideTexture(v?.carrier, v?.risk_level)
  const matSide = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.45 })
  const cargoBox = new THREE.Mesh(
    new THREE.BoxGeometry(bodyLen, bodyHeight, bodyWidth),
    [matBody, matBody, matTarp, matChassis, matSide, matSide]
  )
  cargoBox.position.set(-0.6, 1.55, 0)
  cargoBox.castShadow = true
  group.add(cargoBox)

  // Vertical reinforcing wood/steel slats on sides
  for (let sx = -bodyLen / 2 + 0.2; sx <= bodyLen / 2; sx += 0.8) {
    ;[-bodyWidth / 2 - 0.02, bodyWidth / 2 + 0.02].forEach(sz => {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.06, bodyHeight, 0.04), matChassis)
      rib.position.set(-0.6 + sx, 1.55, sz)
      group.add(rib)
    })
  }

  // 4. EXACT 10 RUBBER WHEELS (1 Front Steer Axle + 2 Rear Tandem Axles with Dual Tires)
  const wheelGeom = new THREE.CylinderGeometry(0.40, 0.40, 0.24, 16)
  const hubGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.26, 8)
  const wheelMeshes = []

  // Front Steer Axle (2 wheels: 1 left, 1 right)
  const frontAxleX = cabX + 0.2
  ;[-0.78, 0.78].forEach(wz => {
    const wGroup = new THREE.Group()
    const tire = new THREE.Mesh(wheelGeom, matRubber)
    tire.rotation.x = Math.PI / 2
    tire.castShadow = true
    const hub = new THREE.Mesh(hubGeom, matChrome)
    hub.rotation.x = Math.PI / 2
    wGroup.add(tire, hub)
    wGroup.position.set(frontAxleX, 0.40, wz)
    group.add(wGroup)
    wheelMeshes.push(wGroup)
  })

  // Rear Tandem Axles (Axle 1 at x = -1.2, Axle 2 at x = -2.2)
  // Each axle has DUAL tires on each side (2 left + 2 right = 4 wheels per axle * 2 axles = 8 wheels)
  ;[-1.2, -2.2].forEach(axX => {
    // Left Dual Tires (z = -0.66 and z = -0.88)
    ;[-0.66, -0.88].forEach(wz => {
      const wGroup = new THREE.Group()
      const tire = new THREE.Mesh(wheelGeom, matRubber)
      tire.rotation.x = Math.PI / 2
      tire.castShadow = true
      const hub = new THREE.Mesh(hubGeom, matChrome)
      hub.rotation.x = Math.PI / 2
      wGroup.add(tire, hub)
      wGroup.position.set(axX, 0.40, wz)
      group.add(wGroup)
      wheelMeshes.push(wGroup)
    })
    // Right Dual Tires (z = +0.66 and z = +0.88)
    ;[0.66, 0.88].forEach(wz => {
      const wGroup = new THREE.Group()
      const tire = new THREE.Mesh(wheelGeom, matRubber)
      tire.rotation.x = Math.PI / 2
      tire.castShadow = true
      const hub = new THREE.Mesh(hubGeom, matChrome)
      hub.rotation.x = Math.PI / 2
      wGroup.add(tire, hub)
      wGroup.position.set(axX, 0.40, wz)
      group.add(wGroup)
      wheelMeshes.push(wGroup)
    })
  })
  // Total Wheels = 2 + 4 + 4 = 10 WHEELS!

  // Fuel tank & Battery box between front & rear axles
  const fuelTank = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.2, 12), matChrome)
  fuelTank.rotation.z = Math.PI / 2
  fuelTank.position.set(0.6, 0.45, -0.7)
  const batteryBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.45), matChassis)
  batteryBox.position.set(0.6, 0.45, 0.7)
  group.add(fuelTank, batteryBox)

  // Mudflaps with reflective chevrons
  const mudflap = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 1.6), new THREE.MeshStandardMaterial({ map: createHazardTexture() }))
  mudflap.position.set(-bodyLen / 2 - 0.65, 0.45, 0)
  group.add(mudflap)

  // Hitbox for raycasting
  const hitbox = new THREE.Mesh(new THREE.BoxGeometry(bodyLen + cabLen + 0.6, 3.2, 2.4), new THREE.MeshBasicMaterial({ visible: false }))
  hitbox.position.set(0.2, 1.6, 0)
  hitbox.userData = { pickable: true, kind: 'vehicle', data: { ...v, display_type: '10-Wheel Heavy Lorry (Taurus 25T)' } }
  group.add(hitbox)

  group.userData.wheelMeshes = wheelMeshes
  return { group, hitbox }
}

/* ==================== 6-WHEEL MEDIUM LORRY (TATA 1109 / 1613 RIGID FREIGHT) ==================== */
function build6WheelLorry(v, isDark = false) {
  const group = new THREE.Group()
  const cInfo = CARRIER_COLORS[v?.carrier] || CARRIER_COLORS.DEFAULT

  const matCab = new THREE.MeshStandardMaterial({
    color: cInfo.cab,
    metalness: 0.35,
    roughness: 0.3,
  })
  const matChassis = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.6,
    roughness: 0.45,
  })
  const matBody = new THREE.MeshStandardMaterial({
    color: cInfo.trailer,
    metalness: 0.25,
    roughness: 0.4,
  })
  const matChrome = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.9,
    roughness: 0.1,
  })
  const matRubber = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.9,
  })
  const matGlass = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.38,
    roughness: 0.05,
    metalness: 0.1,
  })

  const bodyLen = 4.0
  const bodyWidth = 1.5
  const bodyHeight = 1.75
  const cabLen = 1.4
  const cabWidth = 1.45
  const cabHeight = 1.65

  // 1. Rigid Medium Chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(bodyLen + cabLen + 0.2, 0.22, 1.0), matChassis)
  chassis.position.set(0.1, 0.44, 0)
  group.add(chassis)

  // 2. Medium Forward-Control Cab
  const cabX = bodyLen / 2 + cabLen / 2 - 0.1
  const cab = new THREE.Mesh(new THREE.BoxGeometry(cabLen, cabHeight, cabWidth), matCab)
  cab.position.set(cabX, 1.3, 0)
  cab.castShadow = true

  // Aerodynamic Cab Roof Wind Deflector
  const deflector = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.45, 1.35), matCab)
  deflector.position.set(cabX - 0.1, 2.25, 0)
  deflector.rotation.z = -0.22

  // Windshield
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 1.25), matGlass)
  windshield.position.set(cabX + cabLen / 2 + 0.03, 1.65, 0)

  // Front Bumper with Headlights
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 1.46), matChrome)
  bumper.position.set(cabX + cabLen / 2 + 0.08, 0.52, 0)

  group.add(cab, deflector, windshield, bumper)

  // 3. Medium Closed Freight Container Box with Carrier Branding
  const sideTex = createTrailerSideTexture(v?.carrier, v?.risk_level)
  const matSide = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.45 })
  const cargoBox = new THREE.Mesh(
    new THREE.BoxGeometry(bodyLen, bodyHeight, bodyWidth),
    [matBody, matBody, matBody, matChassis, matSide, matSide]
  )
  cargoBox.position.set(-0.5, 1.45, 0)
  cargoBox.castShadow = true
  group.add(cargoBox)

  // Side underrun protection safety rails
  ;[-0.78, 0.78].forEach(sz => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.04), matChrome)
    rail.position.set(0.4, 0.42, sz)
    group.add(rail)
  })

  // 4. EXACT 6 RUBBER WHEELS (1 Front Steer Axle + 1 Rear Drive Axle with Dual Tires)
  const wheelGeom = new THREE.CylinderGeometry(0.36, 0.36, 0.22, 16)
  const hubGeom = new THREE.CylinderGeometry(0.16, 0.16, 0.24, 8)
  const wheelMeshes = []

  // Front Steer Axle (2 single wheels: 1 left, 1 right)
  const frontAxleX = cabX + 0.1
  ;[-0.72, 0.72].forEach(wz => {
    const wGroup = new THREE.Group()
    const tire = new THREE.Mesh(wheelGeom, matRubber)
    tire.rotation.x = Math.PI / 2
    tire.castShadow = true
    const hub = new THREE.Mesh(hubGeom, matChrome)
    hub.rotation.x = Math.PI / 2
    wGroup.add(tire, hub)
    wGroup.position.set(frontAxleX, 0.36, wz)
    group.add(wGroup)
    wheelMeshes.push(wGroup)
  })

  // Rear Drive Axle (4 wheels: 2 dual tires on left + 2 dual tires on right)
  const rearAxleX = -1.6
  // Left Dual Tires (z = -0.62 and z = -0.82)
  ;[-0.62, -0.82].forEach(wz => {
    const wGroup = new THREE.Group()
    const tire = new THREE.Mesh(wheelGeom, matRubber)
    tire.rotation.x = Math.PI / 2
    tire.castShadow = true
    const hub = new THREE.Mesh(hubGeom, matChrome)
    hub.rotation.x = Math.PI / 2
    wGroup.add(tire, hub)
    wGroup.position.set(rearAxleX, 0.36, wz)
    group.add(wGroup)
    wheelMeshes.push(wGroup)
  })
  // Right Dual Tires (z = +0.62 and z = +0.82)
  ;[0.62, 0.82].forEach(wz => {
    const wGroup = new THREE.Group()
    const tire = new THREE.Mesh(wheelGeom, matRubber)
    tire.rotation.x = Math.PI / 2
    tire.castShadow = true
    const hub = new THREE.Mesh(hubGeom, matChrome)
    hub.rotation.x = Math.PI / 2
    wGroup.add(tire, hub)
    wGroup.position.set(rearAxleX, 0.36, wz)
    group.add(wGroup)
    wheelMeshes.push(wGroup)
  })
  // Total Wheels = 2 + 4 = 6 WHEELS!

  // Hitbox for raycasting
  const hitbox = new THREE.Mesh(new THREE.BoxGeometry(bodyLen + cabLen + 0.4, 2.8, 2.2), new THREE.MeshBasicMaterial({ visible: false }))
  hitbox.position.set(0.1, 1.4, 0)
  hitbox.userData = { pickable: true, kind: 'vehicle', data: { ...v, display_type: '6-Wheel Medium Lorry (Tata 1109)' } }
  group.add(hitbox)

  group.userData.wheelMeshes = wheelMeshes
  return { group, hitbox }
}

/* ==================== DOST / TATA ACE MINI TRUCK (LCV INTRA-PLANT SHUTTLE) ==================== */
function buildDostMiniTruck(v, isDark = false) {
  const group = new THREE.Group()
  const cInfo = CARRIER_COLORS[v?.carrier] || CARRIER_COLORS.DEFAULT

  const matCab = new THREE.MeshStandardMaterial({
    color: cInfo.cab,
    metalness: 0.4,
    roughness: 0.25,
  })
  const matChassis = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.6,
    roughness: 0.5,
  })
  const matBed = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.35,
    roughness: 0.6,
  })
  const matCrate = new THREE.MeshStandardMaterial({
    color: 0xd97706, // wooden carton
    roughness: 0.8,
  })
  const matChrome = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.9,
    roughness: 0.1,
  })
  const matRubber = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.9,
  })
  const matGlass = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.4,
    roughness: 0.05,
    metalness: 0.1,
  })

  const bedLen = 2.1
  const bedWidth = 1.25
  const cabLen = 1.2
  const cabWidth = 1.2
  const cabHeight = 1.35

  // 1. Compact Light Commercial Chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(bedLen + cabLen + 0.1, 0.16, 0.8), matChassis)
  chassis.position.set(0.1, 0.32, 0)
  group.add(chassis)

  // 2. Compact Modern Forward Cab
  const cabX = bedLen / 2 + cabLen / 2 - 0.05
  const cab = new THREE.Mesh(new THREE.BoxGeometry(cabLen, cabHeight, cabWidth), matCab)
  cab.position.set(cabX, 1.05, 0)
  cab.castShadow = true

  // Slanted Nose & Curved Windshield
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.52, 1.05), matGlass)
  windshield.position.set(cabX + cabLen / 2 + 0.02, 1.32, 0)

  // Front Black Bumper
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.24, 1.22), matChassis)
  bumper.position.set(cabX + cabLen / 2 + 0.06, 0.44, 0)

  // Teardrop Headlights
  ;[-0.42, 0.42].forEach(lz => {
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.16), new THREE.MeshBasicMaterial({ color: 0xfef08a }))
    light.position.set(cabX + cabLen / 2 + 0.04, 0.72, lz)
    group.add(light)
  })

  group.add(cab, windshield, bumper)

  // 3. Dropside Cargo Pickup Bed
  const bedFloor = new THREE.Mesh(new THREE.BoxGeometry(bedLen, 0.1, bedWidth), matBed)
  bedFloor.position.set(-0.4, 0.42, 0)
  group.add(bedFloor)

  // Dropside side panels (Left, Right, Tailgate)
  const sideL = new THREE.Mesh(new THREE.BoxGeometry(bedLen, 0.45, 0.05), matCab)
  sideL.position.set(-0.4, 0.68, -bedWidth / 2)
  const sideR = new THREE.Mesh(new THREE.BoxGeometry(bedLen, 0.45, 0.05), matCab)
  sideR.position.set(-0.4, 0.68, bedWidth / 2)
  const tailGate = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, bedWidth), matCab)
  tailGate.position.set(-0.4 - bedLen / 2, 0.68, 0)
  group.add(sideL, sideR, tailGate)

  // Cargo Crates & Cartons in Bed
  ;[[-0.7, -0.25], [-0.7, 0.25], [-0.1, 0.0]].forEach(([cx, cz]) => {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.45), matCrate)
    crate.position.set(cx, 0.7, cz)
    crate.castShadow = true
    group.add(crate)
  })

  // 4. EXACT 4 RUBBER WHEELS (2 Front + 2 Rear Single Tires)
  const wheelGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.18, 14)
  const hubGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.20, 8)
  const wheelMeshes = []

  // Front Axle (2 wheels)
  const frontAxleX = cabX + 0.05
  ;[-0.58, 0.58].forEach(wz => {
    const wGroup = new THREE.Group()
    const tire = new THREE.Mesh(wheelGeom, matRubber)
    tire.rotation.x = Math.PI / 2
    tire.castShadow = true
    const hub = new THREE.Mesh(hubGeom, matChrome)
    hub.rotation.x = Math.PI / 2
    wGroup.add(tire, hub)
    wGroup.position.set(frontAxleX, 0.28, wz)
    group.add(wGroup)
    wheelMeshes.push(wGroup)
  })

  // Rear Axle (2 wheels)
  const rearAxleX = -0.95
  ;[-0.58, 0.58].forEach(wz => {
    const wGroup = new THREE.Group()
    const tire = new THREE.Mesh(wheelGeom, matRubber)
    tire.rotation.x = Math.PI / 2
    tire.castShadow = true
    const hub = new THREE.Mesh(hubGeom, matChrome)
    hub.rotation.x = Math.PI / 2
    wGroup.add(tire, hub)
    wGroup.position.set(rearAxleX, 0.28, wz)
    group.add(wGroup)
    wheelMeshes.push(wGroup)
  })
  // Total = 4 WHEELS!

  // Hitbox for raycasting
  const hitbox = new THREE.Mesh(new THREE.BoxGeometry(bedLen + cabLen + 0.3, 2.2, 1.8), new THREE.MeshBasicMaterial({ visible: false }))
  hitbox.position.set(0.1, 1.1, 0)
  hitbox.userData = { pickable: true, kind: 'vehicle', data: { ...v, display_type: 'Dost Mini Truck / LCV Intra-Plant' } }
  group.add(hitbox)

  group.userData.wheelMeshes = wheelMeshes
  return { group, hitbox }
}

/* ==================== UNIVERSAL LOGISTICS FLEET DISPATCHER ==================== */
function createLogisticsVehicle(v, isDark = false) {
  const vt = (v?.vehicle_type || '').toUpperCase()
  if (vt === '32FT_TRUCK' || vt === '10_WHEEL') {
    return build10WheelLorry(v, isDark)
  }
  if (vt === '20FT_TRUCK' || vt === '6_WHEEL') {
    return build6WheelLorry(v, isDark)
  }
  if (vt === 'VAN' || vt === 'DOST') {
    return buildDostMiniTruck(v, isDark)
  }
  return buildRealisticSemiTruck(v, isDark)
}

/* ==================== 3D PROCEDURAL HUMAN WORKER BUILDER ==================== */
function buildHumanWorker({
  name = 'Operator',
  role = 'Warehouse Operator',
  department = 'Finished-Goods Logistics',
  task = 'Active Loading & Pallet Staging',
  shift = 'Day Shift A',
  vestColor = 0xf97316, // safety orange (0xf97316) or safety yellow (0xeab308) or supervisor blue (0x0284c7)
  hatColor = 0xfacc15,  // yellow (0xfacc15), white supervisor (0xffffff), orange marshal (0xf97316)
  tool = 'scanner',     // 'scanner' | 'clipboard' | 'tablet' | 'box' | 'marshal' | 'pallet_jack' | 'none'
  isDark = false,
}) {
  const group = new THREE.Group()

  // Materials
  const matPants = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.85 }) // Navy work trousers
  const matBoots = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 })  // Black steel-toe boots
  const matSkin = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.65 })  // Skin tone
  const matShirt = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })  // Work uniform shirt
  const matVest = new THREE.MeshStandardMaterial({ color: vestColor, roughness: 0.5 })  // High-vis vest
  const matReflective = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.8, roughness: 0.2 }) // 3M silver stripes
  const matHat = new THREE.MeshStandardMaterial({ color: hatColor, metalness: 0.4, roughness: 0.3 }) // Industrial hard hat

  // 1. Steel-Toe Safety Work Boots
  const bootGeom = new THREE.BoxGeometry(0.13, 0.12, 0.25)
  const bootL = new THREE.Mesh(bootGeom, matBoots)
  bootL.position.set(-0.1, 0.06, 0.03)
  const bootR = new THREE.Mesh(bootGeom, matBoots)
  bootR.position.set(0.1, 0.06, 0.03)
  group.add(bootL, bootR)

  // 2. Legs (Work Trousers)
  const legGeom = new THREE.BoxGeometry(0.12, 0.65, 0.13)
  const legL = new THREE.Mesh(legGeom, matPants)
  legL.position.set(-0.1, 0.42, 0)
  const legR = new THREE.Mesh(legGeom, matPants)
  legR.position.set(0.1, 0.42, 0)
  group.add(legL, legR)

  // 3. Torso with High-Visibility Safety Vest
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.58, 0.22), matShirt)
  torso.position.set(0, 1.02, 0)
  torso.castShadow = true

  // High-Vis Safety Vest
  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.54, 0.24), matVest)
  vest.position.set(0, 1.02, 0)

  // 3M Reflective Bands
  const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.045, 0.25), matReflective)
  stripe1.position.set(0, 1.10, 0)
  const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.045, 0.25), matReflective)
  stripe2.position.set(0, 0.90, 0)
  group.add(torso, vest, stripe1, stripe2)

  // 4. Neck, Head and Industrial Safety Hard Hat
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.12, 8), matSkin)
  neck.position.set(0, 1.34, 0)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), matSkin)
  head.position.set(0, 1.45, 0)

  const hatDome = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2), matHat)
  hatDome.position.set(0, 1.48, 0)
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.03, 12), matHat)
  hatBrim.position.set(0, 1.47, 0.03)
  group.add(neck, head, hatDome, hatBrim)

  // 5. Arms & Handheld Tool
  const armGeom = new THREE.BoxGeometry(0.09, 0.52, 0.09)
  const armL = new THREE.Mesh(armGeom, matShirt)
  const armR = new THREE.Mesh(armGeom, matShirt)

  let scannerBeam = null
  let wandL = null
  let wandR = null

  if (tool === 'scanner') {
    armL.position.set(-0.23, 0.95, 0)
    armR.position.set(0.23, 1.08, 0.18)
    armR.rotation.x = -Math.PI / 2.6

    // Barcode terminal scanner
    const scannerBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.11, 0.14), new THREE.MeshStandardMaterial({ color: 0x0f172a }))
    scannerBody.position.set(0.23, 1.18, 0.36)
    scannerBeam = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.55, 6),
      new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.65 })
    )
    scannerBeam.rotation.x = -Math.PI / 2
    scannerBeam.position.set(0.23, 1.18, 0.68)
    group.add(scannerBody, scannerBeam)
  } else if (tool === 'clipboard') {
    armL.position.set(-0.21, 0.98, 0.14)
    armL.rotation.x = -Math.PI / 3.5
    armR.position.set(0.21, 0.98, 0.14)
    armR.rotation.x = -Math.PI / 3.5

    const clipboard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.28), new THREE.MeshStandardMaterial({ color: 0x78350f }))
    clipboard.position.set(0, 1.02, 0.24)
    clipboard.rotation.x = Math.PI / 4
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.025, 0.24), new THREE.MeshBasicMaterial({ color: 0xffffff }))
    paper.position.set(0, 1.03, 0.24)
    paper.rotation.x = Math.PI / 4
    group.add(clipboard, paper)
  } else if (tool === 'tablet') {
    armL.position.set(-0.19, 1.0, 0.15)
    armL.rotation.x = -Math.PI / 3
    armR.position.set(0.22, 0.95, 0)

    const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.15, 0.02), new THREE.MeshStandardMaterial({ color: 0x0f172a }))
    tablet.position.set(-0.08, 1.05, 0.25)
    tablet.rotation.x = -0.4
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.12, 0.025), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }))
    screen.position.set(-0.08, 1.05, 0.252)
    screen.rotation.x = -0.4
    group.add(tablet, screen)
  } else if (tool === 'box') {
    armL.position.set(-0.21, 0.96, 0.16)
    armL.rotation.x = -Math.PI / 2.5
    armR.position.set(0.21, 0.96, 0.16)
    armR.rotation.x = -Math.PI / 2.5

    const box = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.36), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 }))
    box.position.set(0, 0.96, 0.30)
    group.add(box)
  } else if (tool === 'marshal') {
    armL.position.set(-0.24, 1.15, 0)
    armL.rotation.z = Math.PI / 3.2
    armR.position.set(0.24, 1.15, 0)
    armR.rotation.z = -Math.PI / 3.2

    wandL = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.42, 8), new THREE.MeshBasicMaterial({ color: 0xf97316 }))
    wandL.position.set(-0.42, 1.35, 0)
    wandL.rotation.z = Math.PI / 4
    wandR = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.42, 8), new THREE.MeshBasicMaterial({ color: 0xf97316 }))
    wandR.position.set(0.42, 1.35, 0)
    wandR.rotation.z = -Math.PI / 4
    group.add(wandL, wandR)
  } else if (tool === 'pallet_jack') {
    armL.position.set(-0.18, 0.92, 0.18)
    armL.rotation.x = -Math.PI / 3.2
    armR.position.set(0.18, 0.92, 0.18)
    armR.rotation.x = -Math.PI / 3.2
  } else {
    armL.position.set(-0.23, 0.95, 0)
    armR.position.set(0.23, 0.95, 0)
  }

  group.add(armL, armR)

  // Raycasting hitbox for selecting workers
  const hitbox = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 1.8, 0.6),
    new THREE.MeshBasicMaterial({ visible: false })
  )
  hitbox.position.set(0, 0.9, 0)
  hitbox.userData = {
    pickable: true,
    kind: 'worker',
    data: {
      name,
      role,
      department,
      task,
      shift,
      ppe_compliance: '100% (Hard Hat, High-Vis Vest, Steel-Toe Boots)',
      status: 'Active on Shift',
    }
  }
  group.add(hitbox)

  group.userData.scannerBeam = scannerBeam
  group.userData.wandL = wandL
  group.userData.wandR = wandR

  return { group, hitbox }
}

/* ==================== INDUSTRIAL PALLET JACK WITH LOADED CARGO ==================== */
function buildPalletJackWithCargo({ color = 0xdc2626, hasCargo = true }) {
  const group = new THREE.Group()

  const matFrame = new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.35 })
  const matWheels = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
  const matHandle = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 })

  // 1. Dual Forks (Steel tines)
  const forkGeom = new THREE.BoxGeometry(1.4, 0.08, 0.18)
  const forkL = new THREE.Mesh(forkGeom, matFrame)
  forkL.position.set(0.7, 0.12, -0.22)
  const forkR = new THREE.Mesh(forkGeom, matFrame)
  forkR.position.set(0.7, 0.12, 0.22)

  // 2. Hydraulic Pump & Steering Column
  const pumpBody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.38), matFrame)
  pumpBody.position.set(0.12, 0.28, 0)

  // Steering T-Handle
  const handleStem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.05, 8), matHandle)
  handleStem.position.set(-0.2, 0.70, 0)
  handleStem.rotation.z = 0.42
  const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.36, 8), matHandle)
  handleBar.position.set(-0.42, 1.12, 0)
  handleBar.rotation.x = Math.PI / 2

  // Steer Wheels
  const steerWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.14, 10), matWheels)
  steerWheel.position.set(0.12, 0.1, 0)
  steerWheel.rotation.x = Math.PI / 2
  group.add(forkL, forkR, pumpBody, handleStem, handleBar, steerWheel)

  // 3. Wooden Euro Pallet on Forks
  if (hasCargo) {
    const matWood = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 })
    const matCarton = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.75 })

    const palletBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.88), matWood)
    palletBase.position.set(0.75, 0.20, 0)
    group.add(palletBase)

    // Stacked shipping cartons
    ;[
      [0.55, 0.42, -0.22],
      [0.95, 0.42, -0.22],
      [0.55, 0.42, 0.22],
      [0.95, 0.42, 0.22],
      [0.75, 0.72, 0],
    ].forEach(([cx, cy, cz]) => {
      const carton = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.30, 0.36), matCarton)
      carton.position.set(cx, cy, cz)
      carton.castShadow = true
      group.add(carton)
    })
  }

  return group
}

/* ==================== INDUSTRIAL COUNTERBALANCE FORKLIFT ==================== */
function buildCounterbalanceForklift({ color = 0xf59e0b, isDark = false, hasDriver = true, liftingCargo = true }) {
  const group = new THREE.Group()

  const matBody = new THREE.MeshStandardMaterial({ color, metalness: 0.35, roughness: 0.35 })
  const matChassis = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.4 })
  const matMast = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.25 })
  const matForks = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 })
  const matTires = new THREE.MeshStandardMaterial({ color: 0x0a0f1d, roughness: 0.92 })
  const matRims = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 })

  // 1. Heavy Lower Chassis & Rounded Rear Counterweight
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.45, 1.2), matChassis)
  chassis.position.set(0, 0.36, 0)
  chassis.castShadow = true
  group.add(chassis)

  // Counterweight (Tapered curved rear)
  const counterweight = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.75, 16, 1, false, -Math.PI / 2, Math.PI), matBody)
  counterweight.position.set(-0.85, 0.65, 0)
  counterweight.rotation.y = Math.PI / 2
  counterweight.castShadow = true
  group.add(counterweight)

  // Engine Hood / Body Cover
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 1.15), matBody)
  hood.position.set(-0.25, 0.75, 0)
  hood.castShadow = true
  group.add(hood)

  // Black Exhaust Stack
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8), matChassis)
  exhaust.position.set(-0.95, 1.45, -0.42)
  group.add(exhaust)

  // 2. Wheels (Dual Front Drive, Rear Steer)
  ;[-0.52, 0.52].forEach(wz => {
    // Front large drive wheels
    const frontTire = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16), matTires)
    frontTire.rotation.x = Math.PI / 2
    frontTire.position.set(0.68, 0.32, wz * 1.1)
    const frontRim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.24, 12), matRims)
    frontRim.rotation.x = Math.PI / 2
    frontRim.position.set(0.68, 0.32, wz * 1.1)
    // Rear smaller steer wheels
    const rearTire = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.18, 16), matTires)
    rearTire.rotation.x = Math.PI / 2
    rearTire.position.set(-0.72, 0.24, wz * 0.95)
    group.add(frontTire, frontRim, rearTire)
  })

  // 3. Overhead Protective Guard (ROPS Safety Cage)
  const cageMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.75, roughness: 0.3 })
  ;[
    [-0.75, -0.48], [-0.75, 0.48],
    [0.35, -0.48], [0.35, 0.48]
  ].forEach(([px, pz]) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.4, 0.06), cageMat)
    post.position.set(px, 1.6, pz)
    group.add(post)
  })
  const roofGuard = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.05, 1.08), cageMat)
  roofGuard.position.set(-0.2, 2.3, 0)
  group.add(roofGuard)

  // Amber Strobe Beacon on Roof
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 12), new THREE.MeshBasicMaterial({ color: 0xf59e0b }))
  beacon.position.set(-0.2, 2.4, 0)
  group.add(beacon)

  // 4. Operator Seat & Steering Console
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.42, 0.44), matChassis)
  seat.position.set(-0.25, 1.18, 0)
  const steering = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.03, 12), matChassis)
  steering.rotation.x = 0.45
  steering.position.set(0.2, 1.48, 0)
  group.add(seat, steering)

  // Driver Figure
  if (hasDriver) {
    const matSkin = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.7 })
    const matVest = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.5 }) // High-vis lime vest
    const matHelmet = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.2, roughness: 0.3 }) // Safety yellow hardhat
    const matPants = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6 }) // Dark blue work trousers

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.48, 0.32), matVest)
    body.position.set(-0.2, 1.5, 0)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), matSkin)
    head.position.set(-0.2, 1.84, 0)
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.10, 12), matHelmet)
    hat.position.set(-0.2, 1.94, 0)
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.30), matPants)
    legs.position.set(-0.08, 1.18, 0)
    group.add(body, head, hat, legs)
  }

  // 5. Two-Stage Vertical Hydraulic Mast
  const mastLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.5, 0.08), matMast)
  mastLeft.position.set(0.95, 1.45, -0.42)
  const mastRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.5, 0.08), matMast)
  mastRight.position.set(0.95, 1.45, 0.42)
  const mastBrace1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.92), matMast)
  mastBrace1.position.set(0.95, 2.55, 0)
  const mastBrace2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.92), matMast)
  mastBrace2.position.set(0.95, 1.4, 0)
  group.add(mastLeft, mastRight, mastBrace1, mastBrace2)

  // Fork Carriage & Tines
  const carriage = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.88), matMast)
  carriage.position.set(1.02, 0.58, 0)
  group.add(carriage)

  // Dual L-shaped Steel Forks
  ;[-0.24, 0.24].forEach(fz => {
    const forkUp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.65, 0.10), matForks)
    forkUp.position.set(1.08, 0.58, fz)
    const forkOut = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.05, 0.10), matForks)
    forkOut.position.set(1.68, 0.28, fz)
    group.add(forkUp, forkOut)
  })

  // 6. Wooden Euro-Pallet with Cargo on Forks
  if (liftingCargo) {
    const matWood = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.85 })
    const matBox = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.7 })

    const pallet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.92), matWood)
    pallet.position.set(1.68, 0.36, 0)
    group.add(pallet)

    // Pallet Boxes
    ;[
      [1.48, 0.66, -0.24],
      [1.88, 0.66, -0.24],
      [1.48, 0.66, 0.24],
      [1.88, 0.66, 0.24],
      [1.68, 1.05, 0],
    ].forEach(([bx, by, bz]) => {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.42), matBox)
      box.position.set(bx, by, bz)
      box.castShadow = true
      group.add(box)
    })
  }

  return group
}

/* ==================== INDUSTRIAL MULTI-TIER PALLET RACKING SYSTEM ==================== */
function buildHighBayPalletRacking({ width = 24.0, depth = 2.4, height = 7.5, tiers = 4, isDark = false }) {
  const group = new THREE.Group()

  const matUpright = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.7, roughness: 0.35 }) // Structural blue
  const matBeam = new THREE.MeshStandardMaterial({ color: 0xea580c, metalness: 0.6, roughness: 0.35 }) // Safety orange
  const matWood = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 }) // Wooden Euro pallets
  const matBox = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.75 }) // Cardboard cartons
  const matDrum = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.35 }) // 200L blue oil drums
  const matWrap = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.6, roughness: 0.2 }) // Plastic stretch wrap
  const matUfo = new THREE.MeshBasicMaterial({ color: 0xfef08a }) // High-bay LED UFO light

  const colSpacing = 3.6
  const cols = Math.floor(width / colSpacing) + 1
  const tierH = height / tiers

  // 1. Blue Vertical Upright Trusses
  for (let c = 0; c < cols; c++) {
    const cx = -width / 2 + c * colSpacing
    ;[-depth / 2, depth / 2].forEach(cz => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, height, 0.12), matUpright)
      post.position.set(cx, height / 2, cz)
      post.castShadow = true
      group.add(post)
    })
    // Diagonal cross-lacing between front and back post
    for (let t = 0; t < tiers; t++) {
      const brace = new THREE.Mesh(new THREE.BoxGeometry(0.06, tierH * 1.15, depth), matUpright)
      brace.position.set(cx, (t + 0.5) * tierH, 0)
      brace.rotation.x = t % 2 === 0 ? 0.35 : -0.35
      group.add(brace)
    }
  }

  // 2. Safety-Orange Horizontal Load Beams & Loaded Pallets
  for (let t = 1; t <= tiers; t++) {
    const by = t * tierH
    ;[-depth / 2, depth / 2].forEach(bz => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(width, 0.14, 0.08), matBeam)
      beam.position.set(0, by, bz)
      group.add(beam)
    })

    // Place 2 pallets per bay between columns
    for (let c = 0; c < cols - 1; c++) {
      const cx = -width / 2 + (c + 0.5) * colSpacing
      ;[-colSpacing * 0.24, colSpacing * 0.24].forEach((pxOff, pi) => {
        const px = cx + pxOff
        // Wooden Euro Pallet
        const pallet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 1.0), matWood)
        pallet.position.set(px, by + 0.06, 0)
        group.add(pallet)

        // Varied Cargo Types: Cartons, Drums, or Shrink-wrapped loads
        const cargoType = (c * 3 + t + pi) % 4
        if (cargoType === 0 || cargoType === 1) {
          // Shrink-wrapped carton stack
          const stack = new THREE.Mesh(new THREE.BoxGeometry(1.1, tierH * 0.72, 0.92), matBox)
          stack.position.set(px, by + 0.12 + tierH * 0.36, 0)
          stack.castShadow = true
          const wrap = new THREE.Mesh(new THREE.BoxGeometry(1.14, tierH * 0.74, 0.96), matWrap)
          wrap.position.copy(stack.position)
          group.add(stack, wrap)
        } else if (cargoType === 2) {
          // 4x 200L Blue Industrial Drums on Pallet
          ;[
            [-0.26, -0.24], [-0.26, 0.24],
            [0.26, -0.24], [0.26, 0.24]
          ].forEach(([dx, dz]) => {
            const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.9, 12), matDrum)
            drum.position.set(px + dx, by + 0.12 + 0.45, dz)
            drum.castShadow = true
            group.add(drum)
          })
        } else {
          // Heavy machinery crates
          const crate = new THREE.Mesh(new THREE.BoxGeometry(1.15, tierH * 0.68, 0.92), new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.9 }))
          crate.position.set(px, by + 0.12 + tierH * 0.34, 0)
          group.add(crate)
        }
      })
    }
  }

  // 3. Suspended Overhead Industrial High-Bay UFO LED Fixtures
  for (let c = 0; c < cols - 1; c += 2) {
    const lx = -width / 2 + (c + 1) * colSpacing
    const ufoDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.12, 16), matUfo)
    ufoDisc.position.set(lx, height + 0.4, 0)
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.2, 6), new THREE.MeshBasicMaterial({ color: 0x1e293b }))
    cable.position.set(lx, height + 1.0, 0)
    group.add(ufoDisc, cable)
  }

  return group
}

/* ==================== REALISTIC LANDSCAPE TREES & GREENERY BOULEVARD ==================== */
function buildLandscapeTree(x, z, scale = 1.0) {
  const group = new THREE.Group()

  const matBark = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.96, metalness: 0.04 })
  const matFoliageDark = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.85 })
  const matFoliageMid = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.82 })
  const matFoliageLight = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.78 })

  // Tapered organic trunk with natural root flare
  const trunkH = 2.4 * scale
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * scale, 0.36 * scale, trunkH, 10), matBark)
  trunk.position.set(0, trunkH / 2, 0)
  trunk.castShadow = true
  group.add(trunk)

  // Primary natural limbs / branches
  const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.15 * scale, 1.2 * scale, 7), matBark)
  b1.position.set(0.24 * scale, trunkH * 0.75, 0.14 * scale)
  b1.rotation.set(0.35, 0.4, -0.45)
  const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * scale, 0.13 * scale, 1.1 * scale, 7), matBark)
  b2.position.set(-0.24 * scale, trunkH * 0.8, -0.14 * scale)
  b2.rotation.set(-0.3, -0.4, 0.5)
  group.add(b1, b2)

  // Clustered organic foliage masses (Dodecahedrons with natural multi-tone leaf shading)
  const foliageGeo = new THREE.DodecahedronGeometry(1.0 * scale, 1)
  const clusters = [
    { pos: [0, trunkH + 1.2 * scale, 0], scale: [1.6, 1.35, 1.6], mat: matFoliageMid },
    { pos: [-0.6 * scale, trunkH + 0.8 * scale, 0.4 * scale], scale: [1.15, 0.95, 1.15], mat: matFoliageDark },
    { pos: [0.7 * scale, trunkH + 0.9 * scale, -0.3 * scale], scale: [1.2, 1.05, 1.15], mat: matFoliageLight },
    { pos: [0.1 * scale, trunkH + 1.85 * scale, -0.2 * scale], scale: [1.25, 1.1, 1.2], mat: matFoliageLight },
    { pos: [-0.35 * scale, trunkH + 1.4 * scale, -0.55 * scale], scale: [1.05, 0.9, 1.05], mat: matFoliageDark },
    { pos: [0.4 * scale, trunkH + 1.45 * scale, 0.5 * scale], scale: [1.1, 0.95, 1.0], mat: matFoliageMid },
  ]
  clusters.forEach(({ pos, scale: s, mat }) => {
    const fol = new THREE.Mesh(foliageGeo, mat)
    fol.position.set(...pos)
    fol.scale.set(...s)
    fol.castShadow = true
    fol.receiveShadow = true
    group.add(fol)
  })

  // Concrete Planter Curb Ring & Soil Base
  const planterMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.88 })
  const planter = new THREE.Mesh(new THREE.CylinderGeometry(1.2 * scale, 1.28 * scale, 0.22, 16, 1, true), planterMat)
  planter.position.set(0, 0.11, 0)
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(1.18 * scale, 1.18 * scale, 0.2, 16), matBark)
  soil.position.set(0, 0.1, 0)
  soil.receiveShadow = true
  group.add(planter, soil)

  group.position.set(x, 0.08, z)
  return group
}

/* ==================== REALISTIC HIGH-MAST LIGHTING TOWERS ==================== */
function buildRealisticHighMastTower(x, z) {
  const group = new THREE.Group()
  const matGalvanized = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.28 })
  const matFixture = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.4 })
  const matLens = new THREE.MeshBasicMaterial({ color: 0xfef08a })
  const matRedStrobe = new THREE.MeshBasicMaterial({ color: 0xef4444 })

  // Concrete pedestal footing with anchor bolts
  const footing = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.1, 0.5, 12), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 }))
  footing.position.set(0, 0.25, 0)
  footing.receiveShadow = true
  group.add(footing)

  // 16m Tapered Polygonal Steel Mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.48, 16.0, 8), matGalvanized)
  mast.position.set(0, 8.25, 0)
  mast.castShadow = true
  group.add(mast)

  // Climbing ladder with safety cages up the shaft
  const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.22, 15.5, 0.08), matGalvanized)
  ladder.position.set(0, 8.1, 0.38)
  group.add(ladder)

  // Circular / Octagonal Luminaire Service Head Frame
  const headRing = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.18, 12, 1, true), matGalvanized)
  headRing.position.set(0, 16.2, 0)
  const headSpokes = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, 0.12), matGalvanized)
  headSpokes.position.set(0, 16.2, 0)
  const headSpokesCross = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 2.5), matGalvanized)
  headSpokesCross.position.set(0, 16.2, 0)
  group.add(headRing, headSpokes, headSpokesCross)

  // 6 Directional High-Output LED Floodlight Projector Heads
  for (let a = 0; a < 6; a++) {
    const angle = (a * Math.PI) / 3
    const fx = Math.cos(angle) * 1.15
    const fz = Math.sin(angle) * 1.15

    const floodHousing = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.32, 0.38), matFixture)
    floodHousing.position.set(fx, 16.05, fz)
    floodHousing.rotation.y = -angle
    floodHousing.rotation.x = 0.35 // Tilted 20 degrees down toward yard
    floodHousing.castShadow = true

    const floodLens = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.28), matLens)
    floodLens.position.set(0, -0.01, 0.2)
    floodHousing.add(floodLens)
    group.add(floodHousing)
  }

  // Dual Red Aviation Safety Obstruction Beacons on top spire
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 1.2, 8), matGalvanized)
  spire.position.set(0, 16.9, 0)
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), matRedStrobe)
  beacon.position.set(0, 17.5, 0)
  group.add(spire, beacon)

  group.position.set(x, 0.08, z)
  return group
}

/* ==================== REALISTIC ROOFTOP INDUSTRIAL HVAC CHILLERS ==================== */
function buildRealisticHVACChiller(width = 4.2, depth = 2.6, height = 2.0) {
  const group = new THREE.Group()
  const matChillerBody = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.55, roughness: 0.35 })
  const matLouver = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.7, roughness: 0.4 })
  const matFanCowl = new THREE.MeshStandardMaterial({ color: 0x263238, metalness: 0.8, roughness: 0.3 })
  const matFanBlades = new THREE.MeshBasicMaterial({ color: 0x111827 })

  // Steel vibration isolator dunnage rails
  const dunnageMat = new THREE.MeshStandardMaterial({ color: 0x455a64, metalness: 0.8, roughness: 0.3 })
  const rail1 = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.25, 0.25), dunnageMat)
  rail1.position.set(0, 0.12, depth / 2 - 0.2)
  const rail2 = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.25, 0.25), dunnageMat)
  rail2.position.set(0, 0.12, -depth / 2 + 0.2)
  group.add(rail1, rail2)

  // Main Chiller Cabinet Box
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height - 0.4, depth), matChillerBody)
  body.position.set(0, (height - 0.4) / 2 + 0.25, 0)
  body.castShadow = true
  body.receiveShadow = true
  group.add(body)

  // Side Ventilation Louvers
  const louverFront = new THREE.Mesh(new THREE.BoxGeometry(width - 0.6, height - 0.9, 0.05), matLouver)
  louverFront.position.set(0, (height - 0.4) / 2 + 0.25, depth / 2 + 0.03)
  const louverBack = new THREE.Mesh(new THREE.BoxGeometry(width - 0.6, height - 0.9, 0.05), matLouver)
  louverBack.position.set(0, (height - 0.4) / 2 + 0.25, -depth / 2 - 0.03)
  group.add(louverFront, louverBack)

  // Top Spun Dual Cooling Fan Cowls
  const fanSpacing = width / 2.5
  ;[-fanSpacing / 2, fanSpacing / 2].forEach(fx => {
    const cowl = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.4, 16, 1, true), matFanCowl)
    cowl.position.set(fx, height + 0.05, 0)
    const grille = new THREE.Mesh(new THREE.CircleGeometry(0.84, 16), matFanBlades)
    grille.rotation.x = -Math.PI / 2
    grille.position.set(fx, height + 0.24, 0)
    group.add(cowl, grille)
  })

  return group
}

/* ==================== PHOTOVOLTAIC ROOFTOP SOLAR PANEL ARRAYS ==================== */
function buildPhotovoltaicSolarArray(numRows = 4, panelsPerRow = 8, isDark = false) {
  const group = new THREE.Group()
  const matFrame = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.25 })
  const solarTex = createSolarPanelTexture(isDark)
  const matCell = new THREE.MeshStandardMaterial({
    map: solarTex,
    color: isDark ? 0x0f172a : 0x1e3a8a,
    roughness: 0.2,
    metalness: 0.8,
  })

  const pWidth = 2.4
  const pLength = 1.4

  for (let r = 0; r < numRows; r++) {
    const rz = (r - (numRows - 1) / 2) * 2.2
    for (let c = 0; c < panelsPerRow; c++) {
      const cx = (c - (panelsPerRow - 1) / 2) * 2.6

      // Panel module tilted 18 degrees facing south toward sunlight
      const panel = new THREE.Mesh(new THREE.BoxGeometry(pWidth, 0.05, pLength), matCell)
      panel.position.set(cx, 0.4, rz)
      panel.rotation.x = 0.31 // 18 degrees tilt
      panel.castShadow = true

      // Aluminum mounting leg
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.06), matFrame)
      leg.position.set(cx, 0.2, rz - 0.5)

      group.add(panel, leg)
    }
  }

  return group
}

/* ==================== 2-STORY DISPATCH OPERATIONS COMMAND TOWER ==================== */
function buildDispatchOperationsBuilding(isDark = false) {
  const group = new THREE.Group()

  const matConcrete = new THREE.MeshStandardMaterial({
    color: isDark ? 0x1e293b : 0xe2e8f0,
    roughness: 0.6,
    metalness: 0.2,
  })
  const matAccent = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Corporate blue
    roughness: 0.4,
    metalness: 0.4,
  })
  const matGlass = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.45,
    roughness: 0.05,
    metalness: 0.1,
  })
  const matSteel = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.8,
    roughness: 0.3,
  })
  const matScreen = new THREE.MeshBasicMaterial({ color: 0x2dd4bf }) // Glowing terminal screen

  const bldgWidth = 14.0
  const bldgDepth = 11.0
  const bldgHeight = 9.0

  // 1. Ground Floor Structure (Driver Manifest & Gate Check-In)
  const groundFloor = new THREE.Mesh(new THREE.BoxGeometry(bldgWidth, 4.2, bldgDepth), matConcrete)
  groundFloor.position.set(0, 2.1, 0)
  groundFloor.castShadow = true
  groundFloor.receiveShadow = true
  group.add(groundFloor)

  // Ground Floor Glass Entrance
  const groundGlass = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.6, 0.15), matGlass)
  groundGlass.position.set(0, 1.4, bldgDepth / 2 + 0.05)
  const groundCanopy = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.2, 2.2), matAccent)
  groundCanopy.position.set(0, 2.8, bldgDepth / 2 + 1.1)
  group.add(groundGlass, groundCanopy)

  // Ground Floor Driver Hub Sign
  const groundSign = makeSignBoard('DRIVER MANIFEST & SAFETY HUB', 'CHECK-IN · WEIGH TICKET VERIFICATION · EPOD DESK', '#090d16', '#38bdf8', 6.8, 1.1)
  groundSign.position.set(0, 3.4, bldgDepth / 2 + 0.1)
  group.add(groundSign)

  // 2. Second Floor: Elevated Logistics Control Tower & Dispatch Floor
  const secondFloor = new THREE.Mesh(new THREE.BoxGeometry(bldgWidth + 1.2, 4.2, bldgDepth + 1.2), matAccent)
  secondFloor.position.set(0, 6.3, 0)
  secondFloor.castShadow = true
  group.add(secondFloor)

  // Large Panoramic Tinted Glass Window facing Yard & Docks
  const towerWindow = new THREE.Mesh(new THREE.BoxGeometry(bldgWidth - 1.0, 2.8, 0.2), matGlass)
  towerWindow.position.set(0, 6.5, bldgDepth / 2 + 0.65)
  group.add(towerWindow)

  // Interior Dispatch Workstation Desks & Glowing Monitors
  ;[-3.8, 0, 3.8].forEach(dx => {
    const desk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 1.4), matSteel)
    desk.position.set(dx, 4.65, 3.2)
    // Dual glowing LCD monitors
    ;[-0.6, 0.6].forEach(mx => {
      const mon = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.05), matScreen)
      mon.position.set(dx + mx, 5.4, 3.4)
      group.add(mon)
    })
    group.add(desk)
  })

  // 3. Cantilevered Outdoor Observation Balcony with Safety Railings
  const balcony = new THREE.Mesh(new THREE.BoxGeometry(bldgWidth - 0.4, 0.3, 2.4), matConcrete)
  balcony.position.set(0, 4.35, bldgDepth / 2 + 1.8)
  // Yellow safety guard rails
  const railMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.4 })
  const railFront = new THREE.Mesh(new THREE.BoxGeometry(bldgWidth - 0.4, 1.0, 0.08), railMat)
  railFront.position.set(0, 4.95, bldgDepth / 2 + 2.95)
  const railSideL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 2.4), railMat)
  railSideL.position.set(-bldgWidth / 2 + 0.2, 4.95, bldgDepth / 2 + 1.8)
  const railSideR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 2.4), railMat)
  railSideR.position.set(bldgWidth / 2 - 0.2, 4.95, bldgDepth / 2 + 1.8)
  group.add(balcony, railFront, railSideL, railSideR)

  // 4. Rooftop Communications Mast & Satellite Telemetry Radar
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 5.4, 8), matSteel)
  mast.position.set(0, 11.2, 0)
  const radarDish = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.1, 0.3, 16), matSteel)
  radarDish.rotation.z = Math.PI / 4
  radarDish.position.set(0, 12.8, 0)
  group.add(mast, radarDish)

  // 5. High-Impact Corporate Illuminated Sign
  const mainSign = makeSignBoard('APEX LOGISTICS & DISPATCH COMMAND TOWER', 'REAL-TIME FLEET TELEMETRY · AUTOMATED DISPATCH · WMS BAY ALLOCATION', '#0f172a', '#38bdf8', 13.0, 1.9)
  mainSign.position.set(0, 9.2, bldgDepth / 2 + 0.7)
  group.add(mainSign)

  // Raycasting hitbox
  const hitbox = new THREE.Mesh(new THREE.BoxGeometry(bldgWidth + 2.0, bldgHeight + 2.0, bldgDepth + 4.0), new THREE.MeshBasicMaterial({ visible: false }))
  hitbox.position.set(0, bldgHeight / 2, 1.0)
  hitbox.userData = {
    pickable: true,
    kind: 'dispatch',
    data: {
      center: 'Apex Central Logistics & Dispatch Command Tower',
      facility_code: 'LOG-CMD-01',
      active_shift: 'Day Operations Shift A',
      shift_supervisor: 'S. Ramanathan (Chief Dispatch Controller)',
      active_coordinators: 4,
      connected_systems: 'RFID Weighbridge WB-01, WMS Loading Bay Staging, GPS Corridor IoT Tracker',
      live_metrics: '18 Active Outbound Loads · 6 Dock Bays Synchronized · 0 Gate Queuing Bottlenecks',
      note: 'Command hub coordinates vehicle weighbridge clearance, bay assignments, and corridor transit tracking.'
    }
  }
  group.add(hitbox)

  return { group, hitbox, radarDish }
}

/* ==================== CHENNAI HEAVY FABRICATION & CASTING YARD (TN-01) ==================== */
function buildOutdoorHeavyCastingYard() {
  const group = new THREE.Group()

  const matSteel = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
  const matRawIron = new THREE.MeshStandardMaterial({ color: 0x57534e, metalness: 0.7, roughness: 0.6 })
  const matBeam = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 }) // Primed structural I-beams

  // Heavy Plate & Beam Stacking Racks
  for (let r = 0; r < 4; r++) {
    const rx = -34 + r * 3.8
    // Steel I-beam stacks
    for (let l = 0; l < 3; l++) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.25, 0.45), matBeam)
      beam.position.set(rx, 0.25 + l * 0.3, 0.5)
      beam.castShadow = true
      group.add(beam)
    }
    // Heavy engine casting blocks
    const casting = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.4), matRawIron)
    casting.position.set(rx, 0.7, -2.5)
    casting.castShadow = true
    group.add(casting)
  }

  // Outdoor Gantry Crane Rail Posts
  ;[-36, -20].forEach(gx => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7.0, 0.5), matSteel)
    post.position.set(gx, 3.5, 2.5)
    group.add(post)
  })
  const gantryRail = new THREE.Mesh(new THREE.BoxGeometry(17.0, 0.6, 0.5), matSteel)
  gantryRail.position.set(-28, 6.8, 2.5)
  group.add(gantryRail)

  return group
}

/* ==================== SECURITY CHECKPOINT & MAIN GATE (GATE 01) ==================== */
function buildSecurityGatehouse(isDark = false) {
  const group = new THREE.Group()

  const matCabin = new THREE.MeshStandardMaterial({ color: isDark ? 0x1e293b : 0x334155, roughness: 0.4 })
  const matRoof = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 })
  const matGlass = new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45, roughness: 0.05 })
  const matBarrierPost = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.6 })
  const matBarrierArm = new THREE.MeshStandardMaterial({ color: 0xdc2626 })

  // Guardhouse cabin (3.8m x 3.0m x 2.8m)
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.8, 3.0, 2.8), matCabin)
  cabin.position.set(0, 1.5, 0)
  cabin.castShadow = true
  cabin.receiveShadow = true

  // Overhanging roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.35, 3.6), matRoof)
  roof.position.set(0, 3.15, 0)
  roof.castShadow = true

  // Inspection Window
  const windowFront = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 0.1), matGlass)
  windowFront.position.set(0, 1.8, 1.42)

  // Signboard
  const gateSign = makeSignBoard('GATE 01 - APEX COMMERCIAL CHECKPOINT', 'FASTag RFID + ANPR AUTOMATED ENTRY', '#090d16', '#38bdf8', 4.4, 0.9)
  gateSign.position.set(0, 3.75, 0)

  group.add(cabin, roof, windowFront, gateSign)

  // Inbound & Outbound Boom Barriers
  const barrierInPost = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.4, 0.35), matBarrierPost)
  barrierInPost.position.set(-2.8, 0.7, 1.6)
  const barrierInArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 4.4), matBarrierArm)
  barrierInArm.position.set(0, 0, 2.2)
  const barrierInPivot = new THREE.Group()
  barrierInPivot.position.set(-2.8, 1.25, 1.6)
  barrierInPivot.add(barrierInArm)
  barrierInPivot.rotation.x = -Math.PI / 3 // Open slightly

  const barrierOutPost = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.4, 0.35), matBarrierPost)
  barrierOutPost.position.set(2.8, 0.7, -1.6)
  const barrierOutArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 4.4), matBarrierArm)
  barrierOutArm.position.set(0, 0, -2.2)
  const barrierOutPivot = new THREE.Group()
  barrierOutPivot.position.set(2.8, 1.25, -1.6)
  barrierOutPivot.add(barrierOutArm)

  group.add(barrierInPost, barrierInPivot, barrierOutPost, barrierOutPivot)

  // Traffic Cones
  const matCone = new THREE.MeshStandardMaterial({ color: 0xf97316 })
  const matConeBand = new THREE.MeshBasicMaterial({ color: 0xffffff })
  ;[-3.8, -4.5, -5.2].forEach(cx => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.65, 12), matCone)
    cone.position.set(cx, 0.32, 2.8)
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.15, 12), matConeBand)
    band.position.set(cx, 0.35, 2.8)
    group.add(cone, band)
  })

  // Hitbox for raycaster
  const hitbox = new THREE.Mesh(
    new THREE.BoxGeometry(8.0, 4.5, 7.0),
    new THREE.MeshBasicMaterial({ visible: false })
  )
  hitbox.position.set(0, 2.2, 0)
  hitbox.userData = {
    pickable: true,
    kind: 'security',
    data: {
      zone: 'Security Gatehouse 01 & FASTag RFID Checkpoint',
      officer: 'R. Sekar (Senior Plant Security Inspector)',
      duty_hours: 'Shift A (06:00 - 14:30)',
      rfid_scan_rate: '99.4% Automated FASTag Pass',
      daily_cleared_trucks: 142,
      active_protocol: 'NABL Document Audit + Zero Idle Inside Plant SLA',
      note: 'Monitors commercial vehicle entry authorization, validates carrier e-way bills and assigns entry sequence to Weighbridge WB-01.'
    }
  }
  group.add(hitbox)

  return { group, hitbox, barrierInPivot, barrierOutPivot }
}

/* ==================== VEHICLE STAGING & BUFFER YARD ==================== */
function buildVehicleStagingYard(isDark = false) {
  const group = new THREE.Group()

  const matAsphalt = new THREE.MeshStandardMaterial({ color: isDark ? 0x111c2e : 0x475569, roughness: 0.9 })
  const matWhiteStripe = new THREE.MeshBasicMaterial({ color: 0xf8fafc })
  const hazardTex = createHazardTexture()
  const matHazardCurb = new THREE.MeshStandardMaterial({ map: hazardTex })

  // Pavement (24m x 12m)
  const pavement = new THREE.Mesh(new THREE.BoxGeometry(24, 0.12, 12), matAsphalt)
  pavement.position.set(0, 0.06, 0)
  pavement.receiveShadow = true
  group.add(pavement)

  // 6 Angled Parking Slots (SLOT 01 - SLOT 06)
  for (let s = 0; s < 6; s++) {
    const sx = -9.5 + s * 3.8
    // Dividing White Lines
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 7.5), matWhiteStripe)
    line.position.set(sx - 1.8, 0.13, 0.5)
    line.rotation.y = 0.22
    group.add(line)

    // Wheel Stopper Curb at head of slot
    const stopper = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.28, 0.35), matHazardCurb)
    stopper.position.set(sx, 0.2, -3.8)
    group.add(stopper)

    // Staging Slot Marker Sign
    const slotSign = makeSignBoard(`SLOT 0${s + 1}`, s < 2 ? 'CALL-UP READY' : s < 4 ? 'STAGED' : 'OPEN', '#090d16', s < 2 ? '#16a34a' : s < 4 ? '#f59e0b' : '#64748b', 2.0, 0.6)
    slotSign.position.set(sx, 1.2, -4.2)
    group.add(slotSign)
  }

  // Yard Main Signboard
  const yardSign = makeSignBoard('TRUCK STAGING & BUFFER YARD', 'SLOTS 01 - 06 · CALL-UP TO DOCKS UPON WMS RELEASE', '#0f172a', '#f59e0b', 14.0, 1.6)
  yardSign.position.set(0, 3.2, -5.8)
  group.add(yardSign)

  // Hitbox
  const hitbox = new THREE.Mesh(
    new THREE.BoxGeometry(25, 4.0, 13),
    new THREE.MeshBasicMaterial({ visible: false })
  )
  hitbox.position.set(0, 2.0, 0)
  hitbox.userData = {
    pickable: true,
    kind: 'staging',
    data: {
      zone: 'Vehicle Staging & Buffer Yard (Slots 01 - 06)',
      purpose: 'Holding Inbound Trucks Pre-Weighbridge & Outbound Trucks Awaiting Docks',
      total_slots: 6,
      occupied_slots: 4,
      available_slots: 2,
      avg_dwell_minutes: 18.5,
      note: 'Prevents gate bottlenecks and manages yard traffic. AI Autonomous Agent sequences trucks into loading docks according to order priority.'
    }
  }
  group.add(hitbox)

  return { group, hitbox }
}

/* ==================== 1. REAR MANUFACTURING PLANT UNIT B (POWERTRAIN & HEAVY FABRICATION) ==================== */
function buildPlantUnitB(isDark = false) {
  const group = new THREE.Group()

  const matWall = new THREE.MeshStandardMaterial({
    color: isDark ? 0x1e293b : 0x334155,
    map: createCorrugatedTexture('#1e293b', '#0f172a'),
    roughness: 0.5,
    metalness: 0.35,
  })
  const matRoof = new THREE.MeshStandardMaterial({ color: isDark ? 0x0f172a : 0x475569 })
  const matSteelColumn = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 })
  const matGlass = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 })
  const matHazard = new THREE.MeshStandardMaterial({ map: createHazardTexture() })

  // Main hall structure (34m x 9.5m x 14m)
  const hall = new THREE.Mesh(new THREE.BoxGeometry(34, 9.5, 14), matWall)
  hall.position.set(0, 4.75, 0)
  hall.castShadow = true
  hall.receiveShadow = true
  group.add(hall)

  // Sawtooth industrial roof with clerestory windows
  for (let r = 0; r < 5; r++) {
    const rx = -14 + r * 7.0
    const roofPeak = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.3, 14.2), matRoof)
    roofPeak.position.set(rx + 1.5, 10.3, 0)
    roofPeak.rotation.z = 0.22
    roofPeak.castShadow = true
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.8, 13.8), matGlass)
    glass.position.set(rx + 4.9, 10.4, 0)
    group.add(roofPeak, glass)
  }

  // Steel perimeter columns
  for (let cx = -16; cx <= 16; cx += 5.3) {
    const colFront = new THREE.Mesh(new THREE.BoxGeometry(0.45, 9.8, 0.45), matSteelColumn)
    colFront.position.set(cx, 4.9, 7.1)
    const colBack = new THREE.Mesh(new THREE.BoxGeometry(0.45, 9.8, 0.45), matSteelColumn)
    colBack.position.set(cx, 4.9, -7.1)
    colFront.castShadow = true
    colBack.castShadow = true
    group.add(colFront, colBack)
  }

  // 2 Large Roll-up Equipment Access Doors
  ;[-8, 8].forEach(dx => {
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(4.8, 5.2, 0.3), new THREE.MeshStandardMaterial({ color: 0x0f172a }))
    doorFrame.position.set(dx, 2.6, 7.1)
    const door = new THREE.Mesh(new THREE.BoxGeometry(4.4, 4.8, 0.15), new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.4 }))
    door.position.set(dx, 2.4, 7.15)
    const curb = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.18, 0.4), matHazard)
    curb.position.set(dx, 0.09, 7.4)
    group.add(doorFrame, door, curb)
  })

  // Exterior Illuminated Facade Sign
  const bSign = makeSignBoard(
    'APEX PLANT UNIT B · POWERTRAIN & HEAVY FABRICATION',
    'CHASSIS WELDING · CNC STAMPING · ENGINE CRANKSHAFT MACHINING',
    '#0f172a',
    '#06b6d4',
    24.0,
    2.5
  )
  bSign.position.set(0, 11.2, 7.2)
  group.add(bSign)

  // Rear Facade Sign (Visible when rotating 360° to the back)
  const rearSign = makeSignBoard(
    'UNIT B · HEAVY FABRICATION & POWERTRAIN DIVISION',
    'FACILITY CODE: MFG-PLANT-02 · REAR DISPATCH APRON',
    '#0f172a',
    '#0284c7',
    22.0,
    2.3
  )
  rearSign.position.set(0, 10.8, -7.2)
  rearSign.rotation.y = Math.PI
  group.add(rearSign)

  // Rooftop Industrial HVAC & Ventilation Units
  ;[-10, 0, 10].forEach(vx => {
    const hvac = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.8, 2.4), new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.5 }))
    hvac.position.set(vx, 10.8, -2.5)
    const cowl = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 1.2, 12), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }))
    cowl.position.set(vx, 12.0, -2.5)
    group.add(hvac, cowl)
  })

  // Hitbox
  const hitbox = new THREE.Mesh(new THREE.BoxGeometry(36, 12, 16), new THREE.MeshBasicMaterial({ visible: false }))
  hitbox.position.set(0, 6, 0)
  hitbox.userData = {
    pickable: true,
    kind: 'zone',
    data: {
      zone: 'Apex Manufacturing Unit B (Heavy Powertrain & Chassis)',
      facility_code: 'MFG-UNIT-B',
      purpose: 'High-Tonnage CNC Stamping, Powertrain Machining & Robotic Chassis Welding',
      production_rate: '48 Sub-Assemblies / Hour · Connected to Unit A via Overhead Conveyor Bridge',
      active_crew: '42 Technicians & Robotics Engineers (Shift A)',
      note: 'Feeds manufactured heavy powertrain components into the Finished Goods Warehouse and staging yards.'
    }
  }
  group.add(hitbox)

  return { group, hitbox }
}

/* ==================== 2. RAW MATERIAL SILO FARM & BULK STORAGE ==================== */
function buildIndustrialSiloComplex(isDark = false) {
  const group = new THREE.Group()

  const matSilo = new THREE.MeshStandardMaterial({
    color: isDark ? 0xb0bec5 : 0xdde3ea,
    metalness: 0.92,
    roughness: 0.22,
  })
  const matSteel = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.86, roughness: 0.28 })
  const matSafetyYellow = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5, metalness: 0.2 })
  const matBluePipe = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 })
  const matYellowPipe = new THREE.MeshStandardMaterial({ color: 0xca8a04, metalness: 0.7, roughness: 0.3 })
  const matTealPipe = new THREE.MeshStandardMaterial({ color: 0x0d9488, metalness: 0.7, roughness: 0.3 })

  // Concrete Foundation Slab (24m x 14m)
  const pad = new THREE.Mesh(new THREE.BoxGeometry(24, 0.4, 14), new THREE.MeshStandardMaterial({ color: isDark ? 0x1e293b : 0x94a3b8, roughness: 0.85 }))
  pad.position.set(0, 0.2, 0)
  pad.receiveShadow = true
  group.add(pad)

  // 4 Tall Vertical Cylindrical Silos
  const siloRadius = 2.1
  const siloHeight = 14.5
  const siloPositions = [-6.6, -2.2, 2.2, 6.6]

  siloPositions.forEach((sx, idx) => {
    // Silo Cylinder Body
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(siloRadius, siloRadius, siloHeight, 32), matSilo)
    cyl.position.set(sx, siloHeight / 2 + 1.6, 2.0)
    cyl.castShadow = true
    cyl.receiveShadow = true

    // Circumferential Steel Stiffener Rings
    ;[0.28, 0.52, 0.76].forEach(f => {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(siloRadius + 0.04, siloRadius + 0.04, 0.15, 32, 1, true), matSteel)
      ring.position.set(sx, siloHeight * f + 1.6, 2.0)
      group.add(ring)
    })

    // Conical Top Cap with Relief Vent
    const cap = new THREE.Mesh(new THREE.ConeGeometry(siloRadius + 0.08, 1.8, 32), matSteel)
    cap.position.set(sx, siloHeight + 2.5, 2.0)
    const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.6, 12), matSteel)
    vent.position.set(sx, siloHeight + 3.6, 2.0)

    // Conical Bottom Discharge Hopper
    const hopper = new THREE.Mesh(new THREE.ConeGeometry(siloRadius, 1.6, 20), matSteel)
    hopper.rotation.x = Math.PI
    hopper.position.set(sx, 0.8, 2.0)

    // 4 Heavy Structural Support Legs
    ;[-1.5, 1.5].forEach(lx => {
      ;[-1.5, 1.5].forEach(lz => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.6, 8), matSteel)
        leg.position.set(sx + lx, 0.8, 2.0 + lz)
        group.add(leg)
      })
    })

    // Spiral / Vertical Access Ladder with Safety Cages
    const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.35, siloHeight, 0.08), matSafetyYellow)
    ladder.position.set(sx, siloHeight / 2 + 1.6, 2.0 + siloRadius + 0.1)
    group.add(cyl, cap, vent, hopper, ladder)

    // Stencil Silo Number
    const sTag = makeSignBoard(`SILO 0${idx + 1}`, 'RAW BULK POLYMER', '#090d16', '#38bdf8', 2.4, 0.8)
    sTag.position.set(sx, 8.5, 2.0 + siloRadius + 0.15)
    group.add(sTag)
  })

  // Rooftop Connecting Catwalk with Yellow Safety Railings
  const catwalk = new THREE.Mesh(new THREE.BoxGeometry(16.0, 0.15, 1.8), matSteel)
  catwalk.position.set(0, siloHeight + 1.8, 2.0)
  const catwalkRailFront = new THREE.Mesh(new THREE.BoxGeometry(16.0, 1.0, 0.06), matSafetyYellow)
  catwalkRailFront.position.set(0, siloHeight + 2.3, 2.9)
  const catwalkRailBack = new THREE.Mesh(new THREE.BoxGeometry(16.0, 1.0, 0.06), matSafetyYellow)
  catwalkRailBack.position.set(0, siloHeight + 2.3, 1.1)
  group.add(catwalk, catwalkRailFront, catwalkRailBack)

  // 2 Horizontal Bulk Fluid Pressure Tanks
  ;[-4.5, 4.5].forEach(tx => {
    const hTank = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 7.2, 20), matSilo)
    hTank.rotation.z = Math.PI / 2
    hTank.position.set(tx, 2.2, -3.8)
    hTank.castShadow = true

    // Concrete Saddles
    ;[-2.4, 2.4].forEach(sx => {
      const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 3.2), new THREE.MeshStandardMaterial({ color: 0x475569 }))
      saddle.position.set(tx + sx, 0.7, -3.8)
      group.add(saddle)
    })
    group.add(hTank)
  })

  // Reinforced Concrete Containment Bund / Dike Wall
  const bund = new THREE.Mesh(new THREE.BoxGeometry(20, 0.9, 8.5), new THREE.MeshStandardMaterial({ color: isDark ? 0x1e293b : 0x64748b }))
  bund.position.set(0, 0.45, -3.8)
  const bundInterior = new THREE.Mesh(new THREE.BoxGeometry(18.8, 1.0, 7.3), new THREE.MeshStandardMaterial({ color: isDark ? 0x090d16 : 0x334155 }))
  bundInterior.position.set(0, 0.55, -3.8)
  group.add(bund, bundInterior)

  // Multi-tier Overhead Pipeline Rack
  const rack = new THREE.Mesh(new THREE.BoxGeometry(22, 0.3, 0.8), matSteel)
  rack.position.set(0, 4.2, -0.2)
  const pipeBlue = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 22, 12), matBluePipe)
  pipeBlue.rotation.z = Math.PI / 2
  pipeBlue.position.set(0, 4.5, -0.4)
  const pipeYellow = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 22, 12), matYellowPipe)
  pipeYellow.rotation.z = Math.PI / 2
  pipeYellow.position.set(0, 4.5, 0)
  const pipeTeal = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 22, 12), matTealPipe)
  pipeTeal.rotation.z = Math.PI / 2
  pipeTeal.position.set(0, 4.5, 0.4)
  group.add(rack, pipeBlue, pipeYellow, pipeTeal)

  // Facility Sign
  const siloSign = makeSignBoard(
    'RAW MATERIALS SILO FARM & BULK FLUID STORAGE',
    'SILOS 01-04 · PNEUMATIC INJECTION FEED · NITROGEN & COOLANT TANKS',
    '#0f172a',
    '#38bdf8',
    18.0,
    2.2
  )
  siloSign.position.set(0, 5.8, 7.2)
  group.add(siloSign)

  // Hitbox
  const hitbox = new THREE.Mesh(new THREE.BoxGeometry(26, 18, 16), new THREE.MeshBasicMaterial({ visible: false }))
  hitbox.position.set(0, 9, 0)
  hitbox.userData = {
    pickable: true,
    kind: 'zone',
    data: {
      zone: 'Raw Material Silo Farm & Bulk Fluid Complex',
      facility_code: 'BULK-SILO-01',
      capacity: '4 x 80-Ton Vertical Silos + 2 x 40,000L Industrial Fluid Vessels',
      connected_units: 'Plant Unit A, Plant Unit B and Finishing Hall via automated pneumatic feed',
      live_status: 'Active Feed: 92% Inventory Level · Automated Level Sensor OK',
      note: 'Houses bulk raw materials, industrial polymers, nitrogen purge, and central pneumatic distribution.'
    }
  }
  group.add(hitbox)

  return { group, hitbox }
}

/* ==================== 3. CENTRAL UTILITIES & COOLING TOWERS ==================== */
function buildCoolingTowersAndUtilities(isDark = false) {
  const group = new THREE.Group()

  const matTower = new THREE.MeshStandardMaterial({
    color: isDark ? 0x1e293b : 0x475569,
    roughness: 0.6,
    metalness: 0.3,
  })
  const matLouver = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
  const matFanShroud = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 })
  const matFanBlade = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.7 })

  const coolingFans = []
  const steamPlumes = []

  // 2 Induced-Draft Industrial Cooling Towers
  ;[-4.2, 4.2].forEach((tx, idx) => {
    // Tower Main Box Structure
    const tower = new THREE.Mesh(new THREE.BoxGeometry(6.4, 5.8, 6.4), matTower)
    tower.position.set(tx, 2.9, 0)
    tower.castShadow = true
    tower.receiveShadow = true

    // Side Louvers
    const louverFront = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.4, 0.2), matLouver)
    louverFront.position.set(tx, 1.8, 3.25)
    const louverBack = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.4, 0.2), matLouver)
    louverBack.position.set(tx, 1.8, -3.25)

    // Top Circular Fan Shroud Cowl
    const shroud = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.3, 1.2, 20), matFanShroud)
    shroud.position.set(tx, 6.4, 0)

    // Rotating 4-Blade Fan Group
    const fanPivot = new THREE.Group()
    fanPivot.position.set(tx, 6.4, 0)
    for (let b = 0; b < 4; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.35), matFanBlade)
      blade.rotation.y = (b * Math.PI) / 2
      blade.position.set(Math.cos((b * Math.PI) / 2) * 0.9, 0, Math.sin((b * Math.PI) / 2) * 0.9)
      fanPivot.add(blade)
    }
    coolingFans.push(fanPivot)

    // Evaporative Steam / Vapor Plume
    const vapor = new THREE.Mesh(
      new THREE.SphereGeometry(1.4, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.4 })
    )
    vapor.position.set(tx, 8.2, 0)
    steamPlumes.push({ mesh: vapor, baseX: tx, offset: idx * 1.5 })

    group.add(tower, louverFront, louverBack, shroud, fanPivot, vapor)
  })

  // Industrial Screw Chiller Unit & Pumps
  const chiller = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.4, 3.2), new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5 }))
  chiller.position.set(0, 1.2, -6.5)
  group.add(chiller)

  // Secondary Electrical Transformer Substation
  const subTrans = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 2.8), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6 }))
  subTrans.position.set(0, 1.6, 6.5)
  // Bushing insulators
  ;[-1.2, 0, 1.2].forEach(bx => {
    const bushing = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0xd97706 }))
    bushing.position.set(bx, 3.8, 6.5)
    group.add(bushing)
  })
  const subSign = makeSignBoard('DANGER: 33 KV SUBSTATION', 'CENTRAL POWER TRANSFORMER', '#090d16', '#ef4444', 3.8, 0.8)
  subSign.position.set(0, 2.8, 8.0)
  group.add(subTrans, subSign)

  // Central Utility Signboard
  const utilSign = makeSignBoard(
    'CENTRAL ENERGY & INDUSTRIAL COOLING STATION',
    'COOLING TOWERS CT-01 & CT-02 · 1800 TR CAPACITY · 33KV POWER BUS',
    '#0f172a',
    '#10b981',
    18.0,
    2.2
  )
  utilSign.position.set(0, 5.2, -3.8)
  group.add(utilSign)

  // Hitbox
  const hitbox = new THREE.Mesh(new THREE.BoxGeometry(18, 10, 18), new THREE.MeshBasicMaterial({ visible: false }))
  hitbox.position.set(0, 5, 0)
  hitbox.userData = {
    pickable: true,
    kind: 'zone',
    data: {
      zone: 'Central Energy & Industrial Cooling Station (CT-01 & CT-02)',
      facility_code: 'UTL-COOL-01',
      capacity: '1,800 Tons Refrigeration (TR) · Closed-Loop Chilled Water Circulation',
      active_status: 'Dual Cooling Towers Operational · 24.5°C Process Supply Water',
      note: 'Provides industrial cooling water and heavy electric power to Plant Unit A, Unit B, and Clean Room Assembly.'
    }
  }
  group.add(hitbox)

  return { group, hitbox, coolingFans, steamPlumes }
}

/* ==================== 4. INTERNAL LOGISTICS MATERIAL TUG ==================== */
function buildInternalMaterialTug(isDark = false) {
  const group = new THREE.Group()

  const matTug = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.5, roughness: 0.4 })
  const matDolly = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 })
  const matWheel = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
  const matCrate = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 })

  // Tug tractor body
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 1.3), matTug)
  body.position.set(0, 0.75, 0)
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), new THREE.MeshStandardMaterial({ color: 0x1e293b }))
  cab.position.set(-0.4, 1.5, 0)
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25, 8), new THREE.MeshBasicMaterial({ color: 0xfacc15 }))
  beacon.position.set(-0.4, 2.25, 0)
  group.add(body, cab, beacon)

  // 4 Tug Wheels
  ;[-0.7, 0.7].forEach(wx => {
    ;[-0.65, 0.65].forEach(wz => {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 12), matWheel)
      wh.rotation.x = Math.PI / 2
      wh.position.set(wx, 0.3, wz)
      group.add(wh)
    })
  })

  // 2 Trailing Dollies with parts crates
  ;[-3.4, -6.4].forEach(dx => {
    const dolly = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.25, 1.3), matDolly)
    dolly.position.set(dx, 0.45, 0)
    ;[-0.8, 0.8].forEach(dwx => {
      ;[-0.65, 0.65].forEach(dwz => {
        const dwh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.15, 10), matWheel)
        dwh.rotation.x = Math.PI / 2
        dwh.position.set(dx + dwx, 0.2, dwz)
        group.add(dwh)
      })
    })
    const cr1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 1.0), matCrate)
    cr1.position.set(dx - 0.5, 0.95, 0)
    const cr2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 1.0), new THREE.MeshStandardMaterial({ color: 0x0d9488 }))
    cr2.position.set(dx + 0.5, 0.95, 0)
    group.add(dolly, cr1, cr2)
  })

  return group
}

/* ==================== 5. OVERHEAD ENCLOSED CONVEYOR BRIDGE ==================== */
function buildOverheadConveyorBridge(isDark = false) {
  const group = new THREE.Group()

  const matTruss = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 })
  const matEnclosure = new THREE.MeshStandardMaterial({ color: isDark ? 0x1e293b : 0xe2e8f0, roughness: 0.5 })
  const matGlass = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 })

  // Bridge Enclosed Tunnel (length 16m connecting z = -12 to z = -28)
  const tunnel = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.6, 16.0), matEnclosure)
  tunnel.position.set(-20.0, 7.8, -20.0)
  tunnel.castShadow = true

  // Side Glass Windows
  const winL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 15.0), matGlass)
  winL.position.set(-21.75, 7.8, -20.0)
  const winR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 15.0), matGlass)
  winR.position.set(-18.25, 7.8, -20.0)

  // Structural Support Piers
  ;[-26.0, -14.0].forEach(pz => {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.5, 0.5), matTruss)
    pier.position.set(-20.0, 3.25, pz)
    group.add(pier)
  })

  // Stencil Sign on Bridge
  const bridgeSign = makeSignBoard('AUTOMATED PARTS CONVEYOR', 'UNIT A ⇄ UNIT B DIRECT TRANSFER', '#0f172a', '#38bdf8', 7.5, 1.1)
  bridgeSign.position.set(-18.15, 7.8, -20.0)
  bridgeSign.rotation.y = Math.PI / 2

  group.add(tunnel, winL, winR, bridgeSign)
  return group
}

/* ==================== 6. PERIMETER SECURITY WATCHTOWER ==================== */
function buildSecurityWatchtower(isDark = false) {
  const group = new THREE.Group()
  const matSteel = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
  const matCabin = new THREE.MeshStandardMaterial({ color: isDark ? 0x1e293b : 0xe2e8f0, roughness: 0.5 })
  const matGlass = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 })

  // 4 Legs
  ;[-0.9, 0.9].forEach(lx => {
    ;[-0.9, 0.9].forEach(lz => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 9.0, 8), matSteel)
      leg.position.set(lx, 4.5, lz)
      group.add(leg)
    })
  })
  const platform = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.2, 2.6), matSteel)
  platform.position.set(0, 9.1, 0)
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.2, 2.0), matCabin)
  cabin.position.set(0, 10.3, 0)
  const glass = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.8, 2.05), matGlass)
  glass.position.set(0, 10.5, 0)
  const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.5, 12), new THREE.MeshBasicMaterial({ color: 0xfef08a }))
  spot.rotation.x = Math.PI / 3
  spot.position.set(0, 11.6, 1.0)
  group.add(platform, cabin, glass, spot)
  return group
}

/* ==================== 7. PARKED PERSONNEL CAR / SUV ==================== */
function buildParkedCar(colorHex = 0x0284c7) {
  const group = new THREE.Group()
  const matBody = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.6, roughness: 0.3 })
  const matCabin = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
  const matGlass = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 })
  const matWheel = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 3.8), matBody)
  body.position.set(0, 0.45, 0)
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 2.0), matCabin)
  cab.position.set(0, 0.95, -0.2)
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.1), matGlass)
  windshield.position.set(0, 0.92, 0.8)
  windshield.rotation.x = 0.35
  group.add(body, cab, windshield)

  ;[-0.9, 0.9].forEach(wx => {
    ;[-1.1, 1.1].forEach(wz => {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.2, 12), matWheel)
      wh.rotation.z = Math.PI / 2
      wh.position.set(wx, 0.32, wz)
      group.add(wh)
    })
  })
  return group
}

const CAMERA_PRESETS = {
  overview: { label: 'Campus Master Overview (Wide 360°)', pos: [0, 52, 68], target: [0, 2, -10] },
  campus_wide: { label: 'Full Facility Blueprint (Bird-Eye)', pos: [0, 80, 90], target: [0, 0, -12] },
  front: { label: 'Front Docks & Loading (Elevation)', pos: [12, 14, 22], target: [12, 2, -4] },
  rear: { label: 'Rear Manufacturing & Silos (360° Back)', pos: [0, 24, -58], target: [0, 4, -26] },
  plant_b: { label: 'Plant Unit B (Heavy Powertrain)', pos: [-24, 18, -48], target: [-22, 4, -28] },
  silos: { label: 'Raw Material Silo Farm & Tanks', pos: [6, 18, -48], target: [6, 6, -29] },
  utilities: { label: 'Cooling Towers & Utilities', pos: [32, 16, -46], target: [30, 4, -28] },
  weighbridge: { label: 'Weighbridge WB-01 Commercial Scale', pos: [-20, 7.5, 16], target: [-22, 1.8, 6.5] },
  staging: { label: 'Vehicle Staging Yard & Buffer', pos: [-2, 9, 20], target: [-2, 1.5, 12] },
  docks: { label: 'Loading Docks Bays 01-06 (Truck Apron)', pos: [13, 8.5, 12], target: [13, 2.0, -3.0] },
  warehouse_racks: { label: 'FG Warehouse High-Bay Racks & Cross-Dock', pos: [13, 7.5, -2.0], target: [13, 3.5, -12.0] },
  dispatch: { label: 'Central Dispatch Command Tower', pos: [34, 12, 14], target: [31, 4.5, -5.5] },
  highway: { label: 'Highway Logistics Fleet Corridor', pos: [0, 14, 38], target: [0, 1, 24] },
  aerial: { label: 'Aerial 45° Drone Perspective', pos: [48, 44, 42], target: [0, 3, -10] },
  top: { label: 'Satellite Blueprint (Top-Down)', pos: [0, 95, 0.1], target: [0, 0, -10] },
  human: { label: 'Ground Walk (1.7m Driver View)', pos: [-16, 1.7, 9.0], target: [-22, 1.8, 6.5] },
}

const CAMPUS_ZONES = [
  { id: 'gate', label: 'Gate & Security', icon: ShieldCheck, pos: [-36, 7, 14], target: [-36, 1.8, 6.5] },
  { id: 'weighbridge', label: 'Weighbridge WB-01', icon: Scale, pos: [-20, 7.5, 16], target: [-22, 1.8, 6.5] },
  { id: 'staging', label: 'Staging Yard', icon: Truck, pos: [-2, 9, 20], target: [-2, 1.5, 12] },
  { id: 'docks', label: 'Loading Docks 01-06', icon: Truck, pos: [13, 8.5, 10], target: [13, 2.0, -3.0] },
  { id: 'production', label: 'Unit A Assembly', icon: Factory, pos: [-22, 14, 10], target: [-20, 3, -12] },
  { id: 'plant_b', label: 'Unit B Powertrain (Rear)', icon: Factory, pos: [-24, 18, -48], target: [-22, 4, -28] },
  { id: 'silos', label: 'Silo Farm & Tanks (Rear)', icon: Box, pos: [6, 18, -48], target: [6, 6, -29] },
  { id: 'utilities', label: 'Cooling & Energy (Rear)', icon: Zap, pos: [32, 16, -46], target: [30, 4, -28] },
  { id: 'warehouse', label: 'FG Warehouse', icon: Warehouse, pos: [10, 12, 8], target: [13, 3, -12] },
  { id: 'dispatch', label: 'Dispatch Tower', icon: Building2, pos: [34, 12, 14], target: [31, 4.5, -5.5] },
  { id: 'highway', label: 'Highway Corridor', icon: Compass, pos: [0, 14, 38], target: [0, 1, 24] },
]

/* ==================== MAIN 3D DIGITAL TWIN COMPONENT ==================== */
export default function DigitalTwin3D({ twinData, theme, userRole }) {
  const mountRef = useRef(null)
  const sceneCtxRef = useRef(null)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [riskFilter, setRiskFilter] = useState('ALL')
  const [cameraPreset, setCameraPreset] = useState('overview')
  const [plantFocus, setPlantFocus] = useState('ALL')
  const [shiftMode, setShiftMode] = useState('day') // 'day' | 'night'
  const [autoOrbit, setAutoOrbit] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [weighStatus, setWeighStatus] = useState('WB-01 Scale: Monitoring Inbound & Outbound Fleet')
  const [showTelemetryHud, setShowTelemetryHud] = useState(false)
  const [layers, setLayers] = useState({ buildings: true, vehicles: true, employees: true, infra: true, labels: true })
  const [sideNavCollapsed, setSideNavCollapsed] = useState(false)
  const [cleanView, setCleanView] = useState(false)
  const [activeZoneId, setActiveZoneId] = useState('')

  const playingRef = useRef(playing)
  const speedRef = useRef(speed)
  const shiftModeRef = useRef(shiftMode)
  const autoOrbitRef = useRef(autoOrbit)
  const targetCamPosRef = useRef(null)
  const targetControlsTargetRef = useRef(null)
  playingRef.current = playing
  speedRef.current = speed
  shiftModeRef.current = shiftMode
  autoOrbitRef.current = autoOrbit

  const flyTo = (camPos, lookTarget) => {
    targetCamPosRef.current = new THREE.Vector3(...camPos)
    targetControlsTargetRef.current = new THREE.Vector3(...lookTarget)
  }

  const rotateCamera = (angleDegrees) => {
    const ctx = sceneCtxRef.current
    if (!ctx || !ctx.camera || !ctx.controls) return
    const rad = (angleDegrees * Math.PI) / 180
    const offset = new THREE.Vector3().subVectors(ctx.camera.position, ctx.controls.target)
    const newX = offset.x * Math.cos(rad) - offset.z * Math.sin(rad)
    const newZ = offset.x * Math.sin(rad) + offset.z * Math.cos(rad)
    flyTo(
      [ctx.controls.target.x + newX, ctx.camera.position.y, ctx.controls.target.z + newZ],
      [ctx.controls.target.x, ctx.controls.target.y, ctx.controls.target.z]
    )
  }

  const filteredVehicles = (twinData?.vehicles || []).filter(v => {
    if (plantFocus !== 'ALL' && v.plant_id !== plantFocus) return false
    if (riskFilter === 'DELAYED') return v.shipment_status === 'DELAYED' || v.risk_level === 'CRITICAL'
    if (riskFilter === 'IN_TRANSIT') return v.shipment_status === 'IN_TRANSIT'
    return true
  })

  const whTarget = (twinData?.warehouses || []).find(w => plantFocus === 'ALL' ? w.plant_id === 'IN-KA-01' : w.plant_id === plantFocus) || (twinData?.warehouses || [])[0]

  // Do not auto-open popup on load (User request: No intrusive popup)
  useEffect(() => {
    // Keep selectedItem null by default for clean, unobstructed 3D view
  }, [twinData])

  // Camera preset handler with smooth drone fly-to
  useEffect(() => {
    const preset = CAMERA_PRESETS[cameraPreset]
    if (preset) {
      flyTo(preset.pos, preset.target)
    }
  }, [cameraPreset])

  // Layer visibility sync handler
  useEffect(() => {
    const ctx = sceneCtxRef.current
    if (!ctx) return
    if (ctx.groupBuildings) ctx.groupBuildings.visible = layers.buildings
    if (ctx.groupVehicles) ctx.groupVehicles.visible = layers.vehicles
    if (ctx.groupEmployees) ctx.groupEmployees.visible = layers.employees
    if (ctx.groupInfra) ctx.groupInfra.visible = layers.infra
    if (ctx.groupLabels) ctx.groupLabels.visible = layers.labels
  }, [layers])

  // Lighting shift handler (Day / Night)
  useEffect(() => {
    const ctx = sceneCtxRef.current
    if (!ctx) return
    const { sunLight, hemiLight, nightLights, scene, isDarkBase } = ctx
    if (shiftMode === 'night') {
      scene.background.setHex(0x050811)
      scene.fog.color.setHex(0x050811)
      sunLight.intensity = 0.15
      hemiLight.intensity = 0.25
      nightLights.forEach(l => { l.intensity = 1.8 })
    } else {
      const bgHex = isDarkBase ? 0x090d16 : 0xf1f5f9
      scene.background.setHex(bgHex)
      scene.fog.color.setHex(bgHex)
      sunLight.intensity = isDarkBase ? 1.1 : 1.25
      hemiLight.intensity = isDarkBase ? 0.65 : 0.85
      nightLights.forEach(l => { l.intensity = 0.3 })
    }
  }, [shiftMode])

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const isDark = theme === 'dark'
    const width = container.clientWidth || 900
    const height = container.clientHeight || 580

    const scene = new THREE.Scene()
    const bgCol = isDark ? 0x090d16 : 0xf1f5f9
    scene.background = new THREE.Color(bgCol)
    scene.fog = new THREE.FogExp2(bgCol, 0.0032)

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.5, 1500)
    camera.position.set(0, 52, 68)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = isDark ? 1.14 : 1.18

    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxPolarAngle = Math.PI / 2 - 0.02
    controls.minDistance = 4
    controls.maxDistance = 280
    controls.target.set(0, 2, -10)

    // Cinematic Industrial Lighting Rig (Natural Sky Dome + Warm Radiant Sun)
    const hemiLight = new THREE.HemisphereLight(0xbae6fd, isDark ? 0x0f172a : 0x78716c, isDark ? 0.75 : 0.95)
    scene.add(hemiLight)

    const sunLight = new THREE.DirectionalLight(0xfffbeb, isDark ? 1.25 : 1.45)
    sunLight.position.set(55, 75, 45)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    sunLight.shadow.camera.near = 5
    sunLight.shadow.camera.far = 240
    sunLight.shadow.camera.left = -95
    sunLight.shadow.camera.right = 95
    sunLight.shadow.camera.top = 80
    sunLight.shadow.camera.bottom = -80
    sunLight.shadow.bias = -0.0003
    sunLight.shadow.normalBias = 0.02
    scene.add(sunLight)

    // High-Mast Night Lights Array across entire expanded campus
    const nightLights = []
    const floodlightPositions = [
      [-52, 18, -36],
      [52, 18, -36],
      [-52, 18, 14],
      [52, 18, 14],
      [0, 18, -36],
      [-18, 16, 14],
      [18, 16, 14],
    ]
    floodlightPositions.forEach(([fx, fy, fz]) => {
      const fl = new THREE.PointLight(0xffedd5, 0.35, 60)
      fl.position.set(fx, fy, fz)
      scene.add(fl)
      nightLights.push(fl)
    })

    // ==================== EXPANSIVE INDUSTRIAL CAMPUS GROUND ====================
    // 1. Vast Infinite Outer Terrain (Circular Geometry with radius 900m seamless horizon blending with zero box borders)
    const outerTerrain = new THREE.Mesh(
      new THREE.CircleGeometry(900, 64),
      new THREE.MeshStandardMaterial({ color: bgCol, roughness: 0.98, metalness: 0.02 })
    )
    outerTerrain.rotation.x = -Math.PI / 2
    outerTerrain.position.y = -0.05
    outerTerrain.receiveShadow = true
    scene.add(outerTerrain)

    // 2. Heavy Industrial Concrete Yard Floor (190m x 130m with expansion joints & realistic PBR texture)
    const concreteYardTex = createConcreteYardTexture(isDark)
    const yardPavement = new THREE.Mesh(
      new THREE.BoxGeometry(190, 0.16, 130),
      new THREE.MeshStandardMaterial({
        map: concreteYardTex,
        color: isDark ? 0x94a3b8 : 0xffffff,
        roughness: 0.76,
        metalness: 0.08,
      })
    )
    yardPavement.position.set(0, 0.08, -14.0)
    yardPavement.receiveShadow = true
    scene.add(yardPavement)

    // High-Mast Yard Floodlight Towers (Galvanized Steel Tapered Masts + 6 Directional LED Projectors + Red Aviation Beacons)
    ;[
      [-52, -36], [52, -36], [-52, 14], [52, 14],
      [0, -36], [-18, 14], [18, 14]
    ].forEach(([mx, mz]) => {
      const mastTower = buildRealisticHighMastTower(mx, mz)
      scene.add(mastTower)
    })

    const pickables = []

    // ==================== 1. MANUFACTURING & MACHINING HALL (Unit A) ====================
    const prodCorrugatedTex = createCorrugatedTexture('#1e293b', '#0f172a')
    const matProdWall = new THREE.MeshStandardMaterial({
      color: isDark ? 0x1e293b : 0x334155,
      map: prodCorrugatedTex,
      roughness: 0.5,
      metalness: 0.3,
    })
    const matSteelColumn = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 })

    // Main hall structure (28m x 14m x 8m)
    const prodHall = new THREE.Mesh(new THREE.BoxGeometry(28, 8.0, 14), matProdWall)
    prodHall.position.set(-20, 4.0, -12.0)
    prodHall.castShadow = true
    prodHall.receiveShadow = true
    prodHall.userData = {
      pickable: true,
      kind: 'zone',
      data: {
        zone: 'Apex Manufacturing Unit A (High-Precision Assembly)',
        purpose: 'CNC Machining, Robotic Welding & Automated Gantry Assembly Feed',
        active_vehicles: filteredVehicles.length,
        note: 'Continuous production line directly feeds finished-goods pallets into FG-WH-01 staging warehouse.'
      }
    }
    scene.add(prodHall)
    pickables.push(prodHall)

    // Structural Steel Exterior I-Columns
    for (let cx = -34; cx <= -6; cx += 5.6) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.45, 8.4, 0.45), matSteelColumn)
      col.position.set(cx, 4.2, -4.8)
      col.castShadow = true
      scene.add(col)
    }

    // Sawtooth Roof Clerestory Skylights
    for (let r = 0; r < 4; r++) {
      const rx = -31 + r * 7.0
      const roofPeak = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.3, 14.2), new THREE.MeshStandardMaterial({ color: isDark ? 0x0f172a : 0x475569 }))
      roofPeak.position.set(rx + 1.5, 8.8, -12.0)
      roofPeak.rotation.z = 0.22
      roofPeak.castShadow = true
      const skylightGlass = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 13.8), new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.5 }))
      skylightGlass.position.set(rx + 4.9, 8.9, -12.0)
      scene.add(roofPeak, skylightGlass)
    }

    // Industrial Rooftop HVAC Chillers & Ventilation Handling on Unit A
    const unitAChiller1 = buildRealisticHVACChiller(3.8, 2.2, 1.6)
    unitAChiller1.position.set(-14.0, 8.2, -12.0)
    const unitAChiller2 = buildRealisticHVACChiller(3.8, 2.2, 1.6)
    unitAChiller2.position.set(-26.0, 8.2, -12.0)
    scene.add(unitAChiller1, unitAChiller2)

    // Heavy Industrial Chimneys with Red/White Bands & Steam
    const steamPlumes = []
    ;[-30, -25].forEach((cx, idx) => {
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.95, 12.0, 16), new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.4 }))
      stack.position.set(cx, 6.0, -17.5)
      stack.castShadow = true
      const safetyBand = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 1.4, 16), new THREE.MeshStandardMaterial({ color: 0xdc2626 }))
      safetyBand.position.set(cx, 10.5, -17.5)
      scene.add(stack, safetyBand)

      // Steam Particle Sphere
      const steam = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 10), new THREE.MeshBasicMaterial({ color: 0xf1f5f9, transparent: true, opacity: 0.45 }))
      steam.position.set(cx, 12.8, -17.5)
      scene.add(steam)
      steamPlumes.push({ mesh: steam, baseX: cx, offset: idx * 1.6 })
    })

    // High-Voltage Electrical Substation
    const subStation = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.8, 3.2), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5 }))
    subStation.position.set(-36, 1.4, -15)
    const hazardSign = makeSignBoard('DANGER: HIGH VOLTAGE', '11 KV SUBSTATION', '#090d16', '#f59e0b', 3.4, 0.8)
    hazardSign.position.set(-36, 3.2, -13.3)
    scene.add(subStation, hazardSign)

    // Corporate Factory Facade Sign (Dynamic by Plant Focus)
    const plantTitle = plantFocus === 'IN-TN-01'
      ? 'APEX HEAVY FABRICATION & POWERTRAIN PLANT'
      : 'APEX PRECISION MANUFACTURING'
    const plantSubtitle = plantFocus === 'IN-TN-01'
      ? 'GLOBAL POWERTRAIN & CHASSIS OPERATIONS · CHENNAI (TN-01)'
      : 'HIGH-PRECISION ASSEMBLY & AVIONICS · BENGALURU (KA-01)'

    const factorySign = makeSignBoard(plantTitle, plantSubtitle, '#0f172a', '#14b8a6', 18.0, 2.6)
    factorySign.position.set(-20, 9.8, -4.7)
    scene.add(factorySign)

    // Outdoor Heavy Casting & Raw Materials Yard (Rendered for Chennai TN-01 Heavy Fabrication)
    if (plantFocus === 'IN-TN-01') {
      const heavyYard = buildOutdoorHeavyCastingYard()
      scene.add(heavyYard)
    }

    // Interior Robotics & Bridge Crane
    const robotArms = []
    const weldSparks = []
    ;[-27, -21, -15].forEach((rx, ri) => {
      const cnc = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.4, 2.8), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 }))
      cnc.position.set(rx, 1.4, -14)
      const cncScreen = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.65, 0.1), new THREE.MeshBasicMaterial({ color: 0x2dd4bf }))
      cncScreen.position.set(rx + 0.8, 1.8, -12.5)
      scene.add(cnc, cncScreen)

      const armBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.6, 12), new THREE.MeshStandardMaterial({ color: 0xf97316 }))
      armBase.position.set(rx, 0.6, -11.0)
      const armPivot = new THREE.Group()
      armPivot.position.set(rx, 0.9, -11.0)
      const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.8, 0.28), new THREE.MeshStandardMaterial({ color: 0xf97316 }))
      upperArm.position.y = 0.9
      const forearm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.22, 0.22), new THREE.MeshStandardMaterial({ color: 0xfb923c }))
      forearm.position.set(0.5, 1.7, 0)
      const spark = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfde047 }))
      spark.position.set(1.1, 1.7, 0)
      armPivot.add(upperArm, forearm, spark)
      scene.add(armBase, armPivot)
      robotArms.push({ pivot: armPivot, offset: ri * 1.4 })
      weldSparks.push({ mesh: spark, offset: ri * 2.2 })
    })

    // Traversing Bridge Crane
    const craneGroup = new THREE.Group()
    const craneBeam = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 13.0), new THREE.MeshStandardMaterial({ color: 0xfacc15 }))
    const hoistCable = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 6), new THREE.MeshStandardMaterial({ color: 0x334155 }))
    hoistCable.position.set(0, -1.25, -1.5)
    const hoistedCrate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.2), new THREE.MeshStandardMaterial({ color: 0x0d9488 }))
    hoistedCrate.position.set(0, -2.4, -1.5)
    craneGroup.add(craneBeam, hoistCable, hoistedCrate)
    craneGroup.position.set(-16, 6.2, -12.0)
    scene.add(craneGroup)

    // Motorized Conveyor Line into Warehouse
    const conveyorBelt = new THREE.Mesh(new THREE.BoxGeometry(32.0, 0.45, 1.4), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6 }))
    conveyorBelt.position.set(-10.0, 0.75, -8.5)
    scene.add(conveyorBelt)

    const fgCartons = []
    for (let b = 0; b < 7; b++) {
      const carton = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.9), new THREE.MeshStandardMaterial({ color: b % 2 === 0 ? 0xd97706 : 0x0d9488 }))
      carton.position.set(-24 + b * 4.6, 1.35, -8.5)
      carton.castShadow = true
      scene.add(carton)
      fgCartons.push({ mesh: carton, phase: b / 7 })
    }

    // ==================== 2. FINISHED-GOODS WAREHOUSE & 6 LOADING DOCK BAYS ====================
    // Modern Architectural Pre-Engineered Building (PEB) Materials
    const whCorrugatedTex = createCorrugatedTexture(isDark ? '#1e293b' : '#e2e8f0', isDark ? '#0f172a' : '#cbd5e1')
    const matWhUpper = new THREE.MeshStandardMaterial({
      color: isDark ? 0x334155 : 0xf1f5f9,
      map: whCorrugatedTex,
      roughness: 0.45,
      metalness: 0.25,
    })
    const matWhDado = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark charcoal impact-resistant base wall
      roughness: 0.65,
      metalness: 0.35,
    })
    const matWhTrim = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 })
    const matWhFloor = new THREE.MeshStandardMaterial({
      color: isDark ? 0x1e293b : 0x94a3b8,
      roughness: 0.35, // Polished epoxy sheen
      metalness: 0.15,
    })
    const matDockCanopy = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.25 })
    const matSteelBracket = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.2 })

    // 1. Polished Epoxy Warehouse Floor Slab (27.6m x 14.8m)
    const whFloor = new THREE.Mesh(new THREE.BoxGeometry(27.6, 0.2, 14.8), matWhFloor)
    whFloor.position.set(13.0, 0.55, -12.4)
    whFloor.receiveShadow = true
    scene.add(whFloor)

    // Painted Yellow Forklift Lane & Pedestrian Safety Border inside warehouse
    const matYellowLine = new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    ;[-14.5, -10.2, -6.5].forEach(lz => {
      const yellowPath = new THREE.Mesh(new THREE.BoxGeometry(25.0, 0.02, 0.25), matYellowLine)
      yellowPath.position.set(13.0, 0.66, lz)
      scene.add(yellowPath)
    })

    // Staging Floor Bay Markers on warehouse slab
    ;[3.5, 9.5, 15.5, 21.5].forEach(bx => {
      const bayBox = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.02, 2.2), new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.3 }))
      bayBox.position.set(bx, 0.66, -6.8)
      scene.add(bayBox)
    })

    // 2. High-Bay Enclosure (Rear, Left & Right Walls)
    const whBackWall = new THREE.Mesh(new THREE.BoxGeometry(27.6, 9.5, 0.4), matWhUpper)
    whBackWall.position.set(13.0, 4.75, -19.6)
    whBackWall.castShadow = true
    whBackWall.receiveShadow = true

    const whLeftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 9.5, 14.4), matWhUpper)
    whLeftWall.position.set(-0.6, 4.75, -12.4)
    whLeftWall.castShadow = true
    whLeftWall.receiveShadow = true

    const whRightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 9.5, 14.4), matWhUpper)
    whRightWall.position.set(26.6, 4.75, -12.4)
    whRightWall.castShadow = true
    whRightWall.receiveShadow = true

    // Low Dado impact base perimeter
    const dadoBack = new THREE.Mesh(new THREE.BoxGeometry(27.8, 2.6, 0.45), matWhDado)
    dadoBack.position.set(13.0, 1.3, -19.6)
    const dadoLeft = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.6, 14.6), matWhDado)
    dadoLeft.position.set(-0.6, 1.3, -12.4)
    const dadoRight = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.6, 14.6), matWhDado)
    dadoRight.position.set(26.6, 1.3, -12.4)

    // Modern PEB Gabled Roof with Translucent Skylight Ribbons
    const whRoof = new THREE.Mesh(new THREE.BoxGeometry(28.0, 0.4, 15.0), new THREE.MeshStandardMaterial({ color: isDark ? 0x0f172a : 0x475569 }))
    whRoof.position.set(13.0, 9.75, -12.4)
    whRoof.castShadow = true

    // Translucent Central Skylight Ribbon
    const whSkylight = new THREE.Mesh(new THREE.BoxGeometry(24.0, 0.2, 3.2), new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.45 }))
    whSkylight.position.set(13.0, 9.96, -12.4)

    // Photovoltaic Rooftop Solar Array (Modern Sustainable Factory)
    const whSolar = buildPhotovoltaicSolarArray(3, 7, isDark)
    whSolar.position.set(13.0, 10.0, -16.2)
    scene.add(whSolar)

    // Rooftop Industrial HVAC Chillers with Dual Cooling Fans
    const whChiller1 = buildRealisticHVACChiller(4.2, 2.4, 1.8)
    whChiller1.position.set(4.5, 9.95, -8.6)
    const whChiller2 = buildRealisticHVACChiller(4.2, 2.4, 1.8)
    whChiller2.position.set(21.5, 9.95, -8.6)
    scene.add(whChiller1, whChiller2)

    // 3. Front Wall Above Dock Doors (Upper Clerestory Facade)
    const whFrontUpper = new THREE.Mesh(new THREE.BoxGeometry(27.6, 4.4, 0.35), matWhUpper)
    whFrontUpper.position.set(13.0, 7.3, -5.0)
    whFrontUpper.castShadow = true

    // High Ribbon Clerestory Windows letting natural light in
    const whClerestory = new THREE.Mesh(
      new THREE.BoxGeometry(26.0, 1.1, 0.12),
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45, roughness: 0.05 })
    )
    whClerestory.position.set(13.0, 8.1, -4.8)

    // Corporate Blue Parapet Cap Trim
    const whParapetTrim = new THREE.Mesh(new THREE.BoxGeometry(28.2, 0.35, 0.5), matWhTrim)
    whParapetTrim.position.set(13.0, 9.6, -4.95)

    scene.add(whBackWall, whLeftWall, whRightWall, dadoBack, dadoLeft, dadoRight, whRoof, whSkylight, whFrontUpper, whClerestory, whParapetTrim)

    // 4. INTERIOR MULTI-TIER PALLET RACKING AISLES (3 Double-Deep High-Bay Rows loaded with inventory)
    const rackingRow1 = buildHighBayPalletRacking({ width: 24.0, depth: 2.2, height: 7.2, tiers: 4, isDark })
    rackingRow1.position.set(13.0, 0.65, -8.6)
    const rackingRow2 = buildHighBayPalletRacking({ width: 24.0, depth: 2.2, height: 7.2, tiers: 4, isDark })
    rackingRow2.position.set(13.0, 0.65, -12.8)
    const rackingRow3 = buildHighBayPalletRacking({ width: 24.0, depth: 2.2, height: 7.2, tiers: 4, isDark })
    rackingRow3.position.set(13.0, 0.65, -17.0)
    scene.add(rackingRow1, rackingRow2, rackingRow3)

    // Overhead Hanging Warehouse Aisle Direction Signs
    const signAisleA = makeSignBoard('AISLE 01: FINISHED HEAVY POWERTRAIN', 'QA RELEASED · P1 IMMEDIATE OUTBOUND PICKING', '#090d16', '#38bdf8', 6.4, 0.9)
    signAisleA.position.set(6.5, 6.8, -10.7)
    const signAisleB = makeSignBoard('AISLE 02: HIGH-VALUE AXLES & ENGINES', 'BARCODE VERIFIED · RFID TRACKED LOTS', '#090d16', '#10b981', 6.4, 0.9)
    signAisleB.position.set(19.5, 6.8, -10.7)
    scene.add(signAisleA, signAisleB)

    // Active Counterbalance Forklift moving pallets inside the warehouse aisle
    const aisleForklift = buildCounterbalanceForklift({ color: 0xf59e0b, isDark, hasDriver: true, liftingCargo: true })
    aisleForklift.position.set(6.8, 0.65, -10.7)
    aisleForklift.rotation.y = -Math.PI / 2
    scene.add(aisleForklift)

    // 5. CANTILEVERED STEEL DOCK CANOPY / WEATHER AWNING OVER 6 DOORS
    const dockCanopy = new THREE.Mesh(new THREE.BoxGeometry(27.6, 0.35, 3.8), matDockCanopy)
    dockCanopy.position.set(13.0, 5.2, -3.2)
    dockCanopy.castShadow = true
    scene.add(dockCanopy)

    // Structural Cantilever Tie-Rods & I-Beam Wall Brackets
    for (let k = 0; k < 7; k++) {
      const kx = 1.0 + k * 4.0
      // Angled tension tie rod
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.8, 8), matSteelBracket)
      rod.position.set(kx, 6.3, -3.2)
      rod.rotation.x = 0.52
      // Wall mounting plate
      const mPlate = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.1), matSteelBracket)
      mPlate.position.set(kx, 7.3, -4.9)
      scene.add(rod, mPlate)

      // Recessed High-Brightness LED Dock Downlight on Canopy Soffit
      if (k < 6) {
        const lightX = 2.8 + k * 4.1
        const downlight = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.08, 12), new THREE.MeshBasicMaterial({ color: 0xfef08a }))
        downlight.position.set(lightX, 5.0, -2.8)
        scene.add(downlight)
      }
    }

    // Raycast pickable hitbox for entire warehouse
    const whBuilding = new THREE.Mesh(new THREE.BoxGeometry(28, 9.5, 15), new THREE.MeshBasicMaterial({ visible: false }))
    whBuilding.position.set(13, 4.75, -12.4)
    whBuilding.userData = {
      pickable: true,
      kind: 'warehouse',
      data: whTarget || { plant_id: 'IN-KA-01', warehouse_id: 'FG-WH-01', on_hand_qty: 42000, net_available_qty: 32000 }
    }
    scene.add(whBuilding)
    pickables.push(whBuilding)

    const whSign = makeSignBoard('FG-WH-01 DISTRIBUTION CENTER', `LOT STOCK: ${fmt(whTarget?.net_available_qty || 32450)} UNITS AVAILABLE (QA RELEASED)`, '#0f172a', '#0ea5e9', 18.0, 2.4)
    whSign.position.set(13, 9.9, -4.8)
    scene.add(whSign)

    // Concrete Dock Platform with Yellow Edge Curb
    const dockPlatform = new THREE.Mesh(new THREE.BoxGeometry(25.6, 0.9, 3.2), new THREE.MeshStandardMaterial({ color: 0x475569 }))
    dockPlatform.position.set(13, 0.45, -4.0)
    dockPlatform.receiveShadow = true
    scene.add(dockPlatform)

    const dockCurb = new THREE.Mesh(new THREE.BoxGeometry(25.6, 0.14, 0.2), new THREE.MeshStandardMaterial({ map: createHazardTexture() }))
    dockCurb.position.set(13, 0.95, -2.5)
    scene.add(dockCurb)

    // HEAVY CONCRETE RECESSED TRUCK APRON IN FRONT OF DOCKS (32m x 16m)
    const apronConcrete = new THREE.Mesh(
      new THREE.BoxGeometry(32.0, 0.12, 16.0),
      new THREE.MeshStandardMaterial({ color: isDark ? 0x1e293b : 0x94a3b8, roughness: 0.85 })
    )
    apronConcrete.position.set(13.0, 0.06, 2.0)
    apronConcrete.receiveShadow = true
    scene.add(apronConcrete)

    // Apron Expansion Joint Grid Lines
    const matJoint = new THREE.MeshBasicMaterial({ color: isDark ? 0x0f172a : 0x64748b })
    for (let ax = -1.0; ax <= 27.0; ax += 4.5) {
      const jointLine = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 15.8), matJoint)
      jointLine.position.set(ax, 0.13, 2.0)
      scene.add(jointLine)
    }

    // 6 DEDICATED INDUSTRIAL LOADING DOCK BAYS (BAYS 01 - 06) WITH ACCORDION SHELTERS & WHEEL GUIDES
    const dockBays = []
    const baySpacing = 4.1
    const matDockShelter = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.95, metalness: 0.1 }) // Heavy rubber compression bellows
    const matGuideCurb = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.4, roughness: 0.3 }) // Safety yellow wheel guide steel pipe
    const matRubberBumper = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.98 })

    for (let bay = 0; bay < 6; bay++) {
      const bayX = 2.8 + bay * baySpacing

      // Roll-up Steel Sectional Door
      const isDoorOpen = bay === 0 || bay === 1 || bay === 2 || bay === 3 || bay === 5
      const doorHeight = isDoorOpen ? 1.4 : 3.4
      const doorY = isDoorOpen ? 4.3 : 2.5
      const door = new THREE.Mesh(new THREE.BoxGeometry(2.8, doorHeight, 0.18), new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.4 }))
      door.position.set(bayX, doorY, -5.0)

      // ACCORDION COMPRESSION DOCK SHELTERS / SEALS (Pads framing the door to seal against truck body)
      const shelterTop = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.45, 0.75), matDockShelter)
      shelterTop.position.set(bayX, 4.45, -4.6)
      const shelterLeft = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.8, 0.75), matDockShelter)
      shelterLeft.position.set(bayX - 1.55, 2.5, -4.6)
      const shelterRight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.8, 0.75), matDockShelter)
      shelterRight.position.set(bayX + 1.55, 2.5, -4.6)
      scene.add(shelterTop, shelterLeft, shelterRight)

      // Industrial Rubber Dock Bumpers (Heavy compression blocks at base)
      ;[-1.45, 1.45].forEach(bx => {
        const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.85, 0.42), matRubberBumper)
        bumper.position.set(bayX + bx, 0.72, -2.35)
        scene.add(bumper)
      })

      // Yellow Hydraulic Dock Leveler Lip Plate (Extended into truck bed)
      const leveler = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 1.6), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.6 }))
      leveler.position.set(bayX, 0.92, -2.8)
      scene.add(leveler)

      // YELLOW TUBULAR WHEEL GUIDE CURBS (Guides truck driver reversing straight into the dock seal)
      ;[-1.5, 1.5].forEach(gx => {
        const guide = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 4.2, 12), matGuideCurb)
        guide.rotation.x = Math.PI / 2
        guide.position.set(bayX + gx, 0.14, -0.6)
        scene.add(guide)
      })

      // Dual LED Dock Traffic Signal Light (Red = Dock Locked / Green = Clear)
      const isBayActive = true
      const signalHousing = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.7, 0.16), matRubberBumper)
      signalHousing.position.set(bayX + 1.85, 4.4, -4.85)
      const lightRed = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), new THREE.MeshBasicMaterial({ color: (bay === 0 || bay === 1 || bay === 3) ? 0xef4444 : 0x334155 }))
      lightRed.position.set(bayX + 1.85, 4.56, -4.75)
      const lightGreen = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), new THREE.MeshBasicMaterial({ color: (bay !== 0 && bay !== 1 && bay !== 3) ? 0x16a34a : 0x334155 }))
      lightGreen.position.set(bayX + 1.85, 4.24, -4.75)
      scene.add(signalHousing, lightRed, lightGreen)

      // Bay Number Stencil Sign
      const bayStatusText = bay === 3 ? 'INBOUND UNLOADING' : (bay === 0 || bay === 1) ? 'OUTBOUND LOADING' : bay === 4 ? 'PALLET STAGING' : bay === 5 ? 'EXPRESS COURIER' : 'QA INSPECTION'
      const baySign = makeSignBoard(`BAY 0${bay + 1}`, bayStatusText, '#0f172a', bay === 3 ? '#38bdf8' : (bay === 0 || bay === 1) ? '#ef4444' : '#16a34a', 3.0, 0.8)
      baySign.position.set(bayX, 5.3, -4.85)
      scene.add(door, baySign)

      // DIVERSE REALISTIC FLEET & CARGO DOCKED AT ALL 6 BAYS
      if (bay === 0) {
        // Bay 01: Class-8 Heavy Semi-Trailer (Outbound Loading)
        const d1 = filteredVehicles[0] || { carrier: 'DHL', vehicle_type: '32FT_TRUCK', shipment_id: 'SHP-DOCK-01', risk_level: 'LOW' }
        const truck1 = buildRealisticSemiTruck(d1, isDark)
        truck1.group.rotation.y = -Math.PI / 2
        truck1.group.position.set(bayX, 0.12, 0.2)
        scene.add(truck1.group)
        pickables.push(truck1.hitbox)
      } else if (bay === 1) {
        // Bay 02: 10-WHEEL HEAVY LORRY (Taurus 25T with Slatted Body & Tarpaulin)
        const d2 = filteredVehicles[1] || { carrier: 'BlueDart', vehicle_type: '32FT_TRUCK', shipment_id: 'SHP-DOCK-02', risk_level: 'MEDIUM' }
        const truck2 = build10WheelLorry(d2, isDark)
        truck2.group.rotation.y = -Math.PI / 2
        truck2.group.position.set(bayX, 0.12, 0.4)
        scene.add(truck2.group)
        pickables.push(truck2.hitbox)
      } else if (bay === 2) {
        // Bay 03: 6-WHEEL MEDIUM LORRY (Tata 1109 with Aerodynamic Deflector)
        const d3 = filteredVehicles[2] || { carrier: 'Delhivery', vehicle_type: '20FT_TRUCK', shipment_id: 'SHP-DOCK-03', risk_level: 'LOW' }
        const truck3 = build6WheelLorry(d3, isDark)
        truck3.group.rotation.y = -Math.PI / 2
        truck3.group.position.set(bayX, 0.12, 0.2)
        scene.add(truck3.group)
        pickables.push(truck3.hitbox)
      } else if (bay === 3) {
        // Bay 04: ACTIVE INBOUND UNLOADING TRUCK (Safexpress 10-Wheeler being unloaded)
        const d4 = filteredVehicles[3] || { carrier: 'Safexpress', vehicle_type: '32FT_TRUCK', shipment_id: 'INB-UNLOAD-04', risk_level: 'LOW' }
        const truck4 = build10WheelLorry(d4, isDark)
        truck4.group.rotation.y = -Math.PI / 2
        truck4.group.position.set(bayX, 0.12, 0.3)
        scene.add(truck4.group)
        pickables.push(truck4.hitbox)

        // Dedicated Industrial Counterbalance Forklift at Bay 04 actively unloading incoming pallet
        const unloadForklift = buildCounterbalanceForklift({ color: 0xf97316, isDark, hasDriver: true, liftingCargo: true })
        unloadForklift.position.set(bayX + 1.2, 0.95, -2.4)
        unloadForklift.rotation.y = Math.PI / 2
        scene.add(unloadForklift)
      } else if (bay === 4) {
        // Bay 05: OUTBOUND CARGO STAGING & PRE-LOAD BUFFER
        // Stacks of shrink-wrapped wooden Euro-pallets
        for (let pz = 0; pz < 3; pz++) {
          const palletStack = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 1.4), new THREE.MeshStandardMaterial({ color: pz === 0 ? 0x0284c7 : 0xd97706, roughness: 0.6 }))
          palletStack.position.set(bayX - 0.8 + pz * 1.1, 0.95 + 0.8, -1.8)
          palletStack.castShadow = true
          scene.add(palletStack)
        }
        // Heavy wooden machinery crates with stencils
        const crate1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.2), new THREE.MeshStandardMaterial({ color: 0xb45309 }))
        crate1.position.set(bayX, 0.95 + 0.6, 0.6)
        // Yellow safety bollards guarding the staging apron
        ;[-1.6, 1.6].forEach(bx => {
          const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 12), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.5 }))
          bollard.position.set(bayX + bx, 0.6, 1.6)
          scene.add(bollard)
        })
        scene.add(crate1)
      } else if (bay === 5) {
        // Bay 06: FAST-TRACK EXPRESS COURIER DISPATCH (Dost Mini Truck)
        const d6 = filteredVehicles[4] || { carrier: 'DHL', vehicle_type: 'VAN', shipment_id: 'EXP-PARCEL-06', risk_level: 'LOW' }
        const dostExpress = buildDostMiniTruck(d6, isDark)
        dostExpress.group.rotation.y = -Math.PI / 2
        dostExpress.group.position.set(bayX, 0.12, -0.4)
        scene.add(dostExpress.group)
        pickables.push(dostExpress.hitbox)
      }

      dockBays.push({ bayIndex: bay + 1, bayX, active: isBayActive })
    }

    // ==================== DEDICATED 2-STORY LOGISTICS & DISPATCH COMMAND TOWER ====================
    const dispatchCenter = buildDispatchOperationsBuilding(isDark)
    dispatchCenter.group.position.set(31.0, 0.08, -5.5)
    scene.add(dispatchCenter.group)
    pickables.push(dispatchCenter.hitbox)

    // ==================== HUMAN LOGISTICS CREW & LOADING/UNLOADING EMPLOYEES ====================
    // 1. DOCK BAY 01 CREW: RF Barcode Scanner Operator & Pallet Jack Handler
    const wScan = buildHumanWorker({
      name: 'K. Anand',
      role: 'Warehouse Barcode Scanner Operator',
      department: 'Finished-Goods Logistics',
      task: 'Scanning Outbound Pallet Barcodes into WMS for Bay 01',
      shift: 'Day Shift A (06:00 - 14:30)',
      vestColor: 0xeab308,
      hatColor: 0xfacc15,
      tool: 'scanner',
      isDark,
    })
    wScan.group.position.set(2.8, 0.9, -1.8)
    wScan.group.rotation.y = Math.PI
    scene.add(wScan.group)
    pickables.push(wScan.hitbox)

    // Pallet Jack 1 with wooden Euro pallet and cargo being pushed into Bay 01
    const palletJack1 = buildPalletJackWithCargo({ color: 0xdc2626, hasCargo: true })
    palletJack1.position.set(1.5, 0.9, -2.4)
    palletJack1.rotation.y = -Math.PI / 2
    scene.add(palletJack1)

    const wPallet = buildHumanWorker({
      name: 'M. Suresh',
      role: 'Pallet Staging & Jack Operator',
      department: 'Outbound Warehouse Operations',
      task: 'Transferring QA-Released Pallets into 32FT Commercial Trailer',
      shift: 'Day Shift A (06:00 - 14:30)',
      vestColor: 0xf97316,
      hatColor: 0xfacc15,
      tool: 'pallet_jack',
      isDark,
    })
    wPallet.group.position.set(1.5, 0.9, -1.3)
    wPallet.group.rotation.y = -Math.PI / 2
    scene.add(wPallet.group)
    pickables.push(wPallet.hitbox)

    // 2. DOCK BAY 02 CREW: Material Handler carrying carton & Dock Supervisor with manifest
    const wBox = buildHumanWorker({
      name: 'R. Vignesh',
      role: 'Material Handler & Loader',
      department: 'Floor Logistics Dispatch',
      task: 'Loading Intermodal Shipping Cartons into 10-Wheel Lorry (Bay 02)',
      shift: 'Day Shift A (06:00 - 14:30)',
      vestColor: 0xeab308,
      hatColor: 0xfacc15,
      tool: 'box',
      isDark,
    })
    wBox.group.position.set(6.9, 0.9, -1.7)
    wBox.group.rotation.y = Math.PI
    scene.add(wBox.group)
    pickables.push(wBox.hitbox)

    const wSupervisor = buildHumanWorker({
      name: 'Arun Kumar',
      role: 'Dock Bay 02 Loading Supervisor',
      department: 'Dispatch Operations',
      task: 'Verifying Physical Load Manifest vs ERP Shipping Order',
      shift: 'Day Shift A (06:00 - 14:30)',
      vestColor: 0x0284c7,
      hatColor: 0xffffff,
      tool: 'clipboard',
      isDark,
    })
    wSupervisor.group.position.set(8.6, 0.9, -3.2)
    wSupervisor.group.rotation.y = -Math.PI / 3.2
    scene.add(wSupervisor.group)
    pickables.push(wSupervisor.hitbox)

    // 3. DOCK BAY 03 CREW: Quality Assurance Release Inspector with Tablet
    const wQA = buildHumanWorker({
      name: 'P. Deepa',
      role: 'Quality Assurance Dispatch Inspector',
      department: 'Quality & Compliance',
      task: 'Inspecting Pallet Shrink-Wrap & Seal Integrity at Bay 03',
      shift: 'Day Shift A (06:00 - 14:30)',
      vestColor: 0x10b981,
      hatColor: 0xffffff,
      tool: 'tablet',
      isDark,
    })
    wQA.group.position.set(12.4, 0.9, -2.8)
    wQA.group.rotation.y = -Math.PI / 4
    scene.add(wQA.group)
    pickables.push(wQA.hitbox)

    const palletJack2 = buildPalletJackWithCargo({ color: 0x0284c7, hasCargo: true })
    palletJack2.position.set(14.2, 0.9, -2.2)
    palletJack2.rotation.y = -Math.PI / 2
    scene.add(palletJack2)

    // 4. WEIGHBRIDGE WB-01 STAGE: Yard Safety Traffic Marshal
    const wMarshal = buildHumanWorker({
      name: 'G. Murugan',
      role: 'Yard Safety Traffic Marshal',
      department: 'Traffic Safety & Fleet Logistics',
      task: 'Guiding Inbound Heavy Haulage Vehicles onto Pit Scale WB-01',
      shift: 'Day Shift A (06:00 - 14:30)',
      vestColor: 0xf97316,
      hatColor: 0xf97316,
      tool: 'marshal',
      isDark,
    })
    wMarshal.group.position.set(-15.6, 0.14, 4.6)
    wMarshal.group.rotation.y = -Math.PI / 2
    scene.add(wMarshal.group)
    pickables.push(wMarshal.hitbox)

    // 5. DISPATCH COMMAND TOWER TEAM: Chief Dispatch Controller on Balcony & Coordinators
    const wDispatchLead = buildHumanWorker({
      name: 'S. Ramanathan',
      role: 'Chief Dispatch Operations Controller',
      department: 'Central Logistics Control Tower',
      task: 'Monitoring Yard Dwell Times & Corridor Transit GPS Telemetry',
      shift: 'Day Shift A (06:00 - 14:30)',
      vestColor: 0x0284c7,
      hatColor: 0xffffff,
      tool: 'tablet',
      isDark,
    })
    wDispatchLead.group.position.set(31.0, 4.4, -0.2)
    wDispatchLead.group.rotation.y = Math.PI
    scene.add(wDispatchLead.group)
    pickables.push(wDispatchLead.hitbox)

    // Coordinators seated inside the glass Dispatch Control Room
    ;[-3.4, 3.4].forEach((ox, idx) => {
      const wCoord = buildHumanWorker({
        name: idx === 0 ? 'M. Rajesh' : 'S. Divya',
        role: 'Logistics Corridor Coordinator',
        department: 'Central Logistics Control Tower',
        task: 'Managing Transporter Route SLA & Driver Toll Checkpoints',
        shift: 'Day Shift A (06:00 - 14:30)',
        vestColor: 0x0284c7,
        hatColor: 0xffffff,
        tool: 'none',
        isDark,
      })
      wCoord.group.position.set(31.0 + ox, 4.4, -2.4)
      wCoord.group.rotation.y = Math.PI
      scene.add(wCoord.group)
    })

    // DOST MINI TRUCK PARKED AT WAREHOUSE STAGING APRON (Intra-plant agile courier)
    const dostData = filteredVehicles[3] || { carrier: 'Safexpress', vehicle_type: 'VAN', shipment_id: 'SHP-DOST-01', risk_level: 'LOW' }
    const dostTruck = buildDostMiniTruck(dostData, isDark)
    dostTruck.group.position.set(28.0, 0.12, -1.8)
    dostTruck.group.rotation.y = Math.PI / 3
    scene.add(dostTruck.group)
    pickables.push(dostTruck.hitbox)

    // Warehouse Pallet Racking & Moving Forklift
    for (let r = 0; r < 3; r++) {
      const rx = 6.0 + r * 6.5
      const rackFrame = new THREE.Mesh(new THREE.BoxGeometry(4.4, 5.2, 1.8), new THREE.MeshStandardMaterial({ color: 0x1d4ed8, transparent: true, opacity: 0.35 }))
      rackFrame.position.set(rx, 2.8, -14.5)
      const pallets = new THREE.Mesh(new THREE.BoxGeometry(4.0, 3.8, 1.4), new THREE.MeshStandardMaterial({ color: 0x0d9488, emissive: 0x0d9488, emissiveIntensity: 0.2 }))
      pallets.position.set(rx, 2.2, -14.5)
      scene.add(rackFrame, pallets)
    }

    const forklift = new THREE.Group()
    const flBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 1.1), new THREE.MeshStandardMaterial({ color: 0xfacc15 }))
    flBody.position.y = 0.8
    const flMast = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.2, 0.85), new THREE.MeshStandardMaterial({ color: 0x1e293b }))
    flMast.position.set(1.0, 1.3, 0)
    const flPallet = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.65, 0.9), new THREE.MeshStandardMaterial({ color: 0xd97706 }))
    flPallet.position.set(1.45, 0.7, 0)
    forklift.add(flBody, flMast, flPallet)

    // Forklift Operator Seated in Forklift
    const wForkDriver = buildHumanWorker({
      name: 'V. Prakash',
      role: 'Certified Forklift Operator',
      department: 'Finished-Goods Logistics',
      task: 'High-Bay Pallet Retrieval & Loading Bay Feed',
      shift: 'Day Shift A',
      vestColor: 0xeab308,
      hatColor: 0xfacc15,
      tool: 'none',
      isDark,
    })
    wForkDriver.group.position.set(0.1, 0.55, 0)
    forklift.add(wForkDriver.group)

    forklift.position.set(13, 0.2, -8.0)
    scene.add(forklift)

    // ==================== 3. AUTOMATED HEAVY-DUTY WEIGHBRIDGE STATION (WB-01) ====================
    const matScaleDeck = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.75, roughness: 0.35 }) // Anti-skid diamond steel deck
    const matConcreteRamp = new THREE.MeshStandardMaterial({ color: isDark ? 0x1e293b : 0x94a3b8, roughness: 0.85 })

    // Anti-Skid Diamond Steel Scale Deck (9.2m x 0.38m x 4.4m)
    const wbPit = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.38, 4.4), matScaleDeck)
    wbPit.position.set(-22.0, 0.20, 6.5)
    wbPit.receiveShadow = true
    wbPit.userData = {
      pickable: true,
      kind: 'zone',
      data: {
        zone: 'Automated Weighbridge Station WB-01',
        purpose: 'Automated Gross / Tare Commercial Vehicle Weighing (NABL Certified 60T)',
        active_vehicles: filteredVehicles.length,
        note: 'High-precision digital pit scale with RFID + ANPR camera sequencing and dynamic LED scoreboard.'
      }
    }
    scene.add(wbPit)
    pickables.push(wbPit)

    // INBOUND CONCRETE APPROACH RAMP (Sloped entry ramp with directional road arrow)
    const rampIn = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.24, 4.4), matConcreteRamp)
    rampIn.position.set(-28.6, 0.12, 6.5)
    rampIn.rotation.z = -0.04
    rampIn.receiveShadow = true
    scene.add(rampIn)

    // OUTBOUND CONCRETE EXIT RAMP (Sloped exit ramp)
    const rampOut = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.24, 4.4), matConcreteRamp)
    rampOut.position.set(-15.4, 0.12, 6.5)
    rampOut.rotation.z = 0.04
    rampOut.receiveShadow = true
    scene.add(rampOut)

    // 4 Corner Load Cell Inspection Plates (Caution Red Corner Covers)
    ;[-4.1, 4.1].forEach(lx => {
      ;[-1.8, 1.8].forEach(lz => {
        const loadcell = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.5), new THREE.MeshStandardMaterial({ color: 0xdc2626 }))
        loadcell.position.set(-22.0 + lx, 0.40, 6.5 + lz)
        scene.add(loadcell)
      })
    })

    // High-Visibility Hazard Safety Curbs Along Both Scale Edges
    ;[-2.25, 2.25].forEach(zOff => {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.48, 0.26), new THREE.MeshStandardMaterial({ map: createHazardTexture() }))
      curb.position.set(-22.0, 0.32, 6.5 + zOff)
      scene.add(curb)
    })

    // Cantilever Overhead Gantry with RFID & ANPR Scanners
    const gantryMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 })
    ;[-2.8, 2.8].forEach(zOff => {
      const stanchion = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 5.4, 10), gantryMat)
      stanchion.position.set(-22.0, 2.7, 6.5 + zOff)
      scene.add(stanchion)
    })
    const gantryCrossbeam = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 6.4), gantryMat)
    gantryCrossbeam.position.set(-22.0, 5.3, 6.5)
    scene.add(gantryCrossbeam)

    // Dual ANPR Infrared Cameras on Gantry
    ;[-1.4, 1.4].forEach(cz => {
      const camHousing = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.3), new THREE.MeshStandardMaterial({ color: 0xf1f5f9 }))
      camHousing.position.set(-22.0, 4.9, 6.5 + cz)
      const camLens = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }))
      camLens.position.set(-22.2, 4.9, 6.5 + cz)
      scene.add(camHousing, camLens)
    })

    // DYNAMIC LED OVERHEAD DIGITAL SCOREBOARD READOUT
    const scaleDisplay = makeDynamicScaleDisplay()
    scaleDisplay.mesh.position.set(-22.0, 6.6, 6.5)
    scene.add(scaleDisplay.mesh)

    // Automated Red/White Boom Barrier Gate
    const barrierPost = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.4), new THREE.MeshStandardMaterial({ color: 0xfacc15 }))
    barrierPost.position.set(-17.5, 0.7, 4.2)
    const barrierArmPivot = new THREE.Group()
    barrierArmPivot.position.set(-17.5, 1.25, 4.2)
    const barrierArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 4.8), new THREE.MeshStandardMaterial({ color: 0xdc2626 }))
    barrierArm.position.set(0, 0, 2.4)
    barrierArmPivot.add(barrierArm)
    scene.add(barrierPost, barrierArmPivot)

    // Dual Traffic Signal Light on Weighbridge (Red / Green)
    const wbSignalMat = new THREE.MeshBasicMaterial({ color: 0x16a34a })
    const wbSignal = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), wbSignalMat)
    wbSignal.position.set(-17.5, 2.8, 4.2)
    scene.add(wbSignal)

    // Scanning Green Laser Beam on Weighbridge
    const scanBeamMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.35 })
    const scanBeam = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.2, 3.8), scanBeamMat)
    scanBeam.position.set(-22.0, 2.4, 6.5)
    scene.add(scanBeam)

    // REALISTIC WEIGHBRIDGE OPERATOR CONTROL CABIN / CABIN BOOTH
    const wbKiosk = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 3.2), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 }))
    wbKiosk.position.set(-22.0, 1.6, 11.4)
    const wbKioskRoof = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.35, 3.6), new THREE.MeshStandardMaterial({ color: 0x0284c7 }))
    wbKioskRoof.position.set(-22.0, 3.35, 11.4)

    // Large Panoramic Viewing Window facing the Scale Platform
    const wbWindow = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 1.4, 0.1),
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45, roughness: 0.05 })
    )
    wbWindow.position.set(-22.0, 1.9, 9.75)

    // Interior Operator Terminal Glowing Screen
    const wbScreen = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.08), new THREE.MeshBasicMaterial({ color: 0x2dd4bf }))
    wbScreen.position.set(-22.0, 1.5, 10.4)

    // Weighbridge Station Exterior Certification Signboard
    const wbSign = makeSignBoard('WB-01 AUTOMATED COMMERCIAL SCALE', 'CERTIFIED CAPACITY: 60 TONS · NABL APPROVED', '#090d16', '#2dd4bf', 4.4, 0.9)
    wbSign.position.set(-22.0, 3.9, 9.8)

    scene.add(wbKiosk, wbKioskRoof, wbWindow, wbScreen, wbSign)

    // ==================== 4. ASPHALT ROADWAY, 360° RING ROADS & HIGHWAY ====================
    const roadAsphaltTex = createAsphaltRoadTexture(isDark)
    const matAsphalt = new THREE.MeshStandardMaterial({
      map: roadAsphaltTex,
      color: isDark ? 0x94a3b8 : 0xffffff,
      roughness: 0.86,
      metalness: 0.05,
    })

    // Front Internal Ring Road (Connecting Gate 01, Weighbridge WB-01, Staging Yard, Docks)
    const internalRoad = new THREE.Mesh(new THREE.BoxGeometry(140, 0.1, 6.0), matAsphalt)
    internalRoad.position.set(0, 0.12, 6.5)
    internalRoad.receiveShadow = true
    scene.add(internalRoad)

    // Speed Bumps & Safety Calming Bars at Gate 01 & Weighbridge
    const matSpeedBump = new THREE.MeshStandardMaterial({ map: createHazardTexture(), roughness: 0.8 })
    ;[-32.0, -16.5, 4.0].forEach(bx => {
      const bump = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 5.8, 12), matSpeedBump)
      bump.rotation.x = Math.PI / 2
      bump.position.set(bx, 0.18, 6.5)
      bump.castShadow = true
      scene.add(bump)
    })

    // Rear Logistics Ring Expressway (Width 8.0m, connecting East and West loops behind Plant B & Silos)
    const rearExpressway = new THREE.Mesh(new THREE.BoxGeometry(140, 0.1, 8.0), matAsphalt)
    rearExpressway.position.set(0, 0.12, -39.0)
    rearExpressway.receiveShadow = true
    scene.add(rearExpressway)

    // Rear Road Yellow Centerline
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    for (let x = -64; x <= 64; x += 4.5) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.02, 0.22), dashMat)
      dash.position.set(x, 0.13, -39.0)
      scene.add(dash)
    }

    // West Logistics Connector Road
    const westRoad = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.1, 46.0), matAsphalt)
    westRoad.position.set(-56.0, 0.12, -16.0)
    westRoad.receiveShadow = true
    scene.add(westRoad)

    // East Logistics Corridor Road
    const eastRoad = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.1, 46.0), matAsphalt)
    eastRoad.position.set(56.0, 0.12, -16.0)
    eastRoad.receiveShadow = true
    scene.add(eastRoad)

    // Front 4-Lane Highway Corridor (Width 12.0m, Length 160m)
    const highway = new THREE.Mesh(new THREE.BoxGeometry(160, 0.1, 12.0), matAsphalt)
    highway.position.set(0, 0.06, 24.0)
    highway.receiveShadow = true
    scene.add(highway)

    // Highway yellow dashed centerline
    for (let x = -72; x <= 72; x += 3.8) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.02, 0.2), dashMat)
      dash.position.set(x, 0.13, 24.0)
      scene.add(dash)
    }

    // Pedestrian White Zebra Crossings
    const zebraMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc })
    ;[-14, 20, -56, 56].forEach(zx => {
      for (let z = 4.0; z <= 9.0; z += 0.8) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.02, 0.35), zebraMat)
        stripe.position.set(zx, 0.14, z)
        scene.add(stripe)
      }
    })

    // Campus Boundary Security Fence around the True Perimeter
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 })
    const backFence = new THREE.Mesh(new THREE.BoxGeometry(148, 2.2, 0.1), fenceMat)
    backFence.position.set(0, 1.1, -45.0)
    const westFence = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 62), fenceMat)
    westFence.position.set(-62.0, 1.1, -14.0)
    const eastFence = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 62), fenceMat)
    eastFence.position.set(62.0, 1.1, -14.0)
    scene.add(backFence, westFence, eastFence)

    // 4 Perimeter Corner Watchtowers with Security Searchlights
    const watchCorners = [
      [-62, -44],
      [62, -44],
      [-62, 18],
      [62, 18],
    ]
    watchCorners.forEach(([wx, wz]) => {
      const tower = buildSecurityWatchtower(isDark)
      tower.position.set(wx, 0.08, wz)
      scene.add(tower)
    })

    // ==================== MODERN INDUSTRIAL PARK LANDSCAPING & TREE BOULEVARD ====================
    // 1. Manicured Green Grass Berms along Boulevard & Perimeter
    const matLawn = new THREE.MeshStandardMaterial({
      color: isDark ? 0x0f291e : 0x15803d, // Deep rich green lawn
      roughness: 0.88,
      metalness: 0.05,
    })

    // Front Green Buffer Lawn between Internal Road (z=6.5) and Highway (z=24)
    const frontLawnWest = new THREE.Mesh(new THREE.BoxGeometry(60, 0.14, 5.0), matLawn)
    frontLawnWest.position.set(-30.0, 0.07, 15.5)
    frontLawnWest.receiveShadow = true

    const frontLawnEast = new THREE.Mesh(new THREE.BoxGeometry(60, 0.14, 5.0), matLawn)
    frontLawnEast.position.set(30.0, 0.07, 15.5)
    frontLawnEast.receiveShadow = true

    // West and East Perimeter Green Verges
    const westLawn = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.14, 58), matLawn)
    westLawn.position.set(-59.0, 0.07, -13.0)
    westLawn.receiveShadow = true

    const eastLawn = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.14, 58), matLawn)
    eastLawn.position.set(59.0, 0.07, -13.0)
    eastLawn.receiveShadow = true

    scene.add(frontLawnWest, frontLawnEast, westLawn, eastLawn)

    // 2. Realistic Landscaped Boulevard Trees (matching Indospace / Dholera Logistics Park Photos)
    const treePositions = [
      // Along Front Boulevard
      [-56, 15.5, 1.1], [-44, 15.5, 1.0], [-34, 15.5, 1.2], [-24, 15.5, 0.95],
      [-14, 15.5, 1.1], [6, 15.5, 1.0], [16, 15.5, 1.2], [26, 15.5, 1.05],
      [36, 15.5, 1.15], [48, 15.5, 1.0], [56, 15.5, 1.2],
      // West Boundary Avenue
      [-59, -36, 1.1], [-59, -20, 1.0], [-59, -4, 1.15], [-59, 12, 1.05],
      // East Boundary Avenue
      [59, -36, 1.1], [59, -20, 1.0], [59, -4, 1.15], [59, 12, 1.05],
      // Dispatch Command Tower Courtyard
      [24, 0.5, 0.9], [40, 0.5, 0.95], [42, -12.0, 1.05]
    ]

    treePositions.forEach(([tx, tz, tScale]) => {
      const tree = buildLandscapeTree(tx, tz, tScale)
      scene.add(tree)
    })

    // ==================== REAR INDUSTRIAL CAMPUS (FULL 360° DEPTH) ====================
    // 1. Plant Unit B (Powertrain & Heavy Fabrication)
    const plantB = buildPlantUnitB(isDark)
    plantB.group.position.set(-20.0, 0.08, -28.0)
    scene.add(plantB.group)
    pickables.push(plantB.hitbox)

    // Overhead Conveyor Bridge connecting Unit A and Unit B across central accessway
    const conveyorBridge = buildOverheadConveyorBridge(isDark)
    scene.add(conveyorBridge)

    // Rear Raw Materials Inbound Receiving Flatbed Lorry at Unit B
    const rearTruckData = {
      carrier: 'TCI', vehicle_type: '32FT_TRUCK', shipment_id: 'RAW-STL-041', customer_order_id: 'PO-RAW-00912',
      shipment_qty: 2400, vehicle_utilization_pct: 96.5, transit_tat_hrs: 14, risk_level: 'LOW',
      recommended_action: 'Direct Delivery: Heavy alloy steel coils & crankshaft billets to Plant Unit B.'
    }
    const rearFlatbedTruck = build10WheelLorry(rearTruckData, isDark)
    rearFlatbedTruck.group.position.set(-11.0, 0.12, -21.0)
    rearFlatbedTruck.group.rotation.y = Math.PI / 2
    scene.add(rearFlatbedTruck.group)
    pickables.push(rearFlatbedTruck.hitbox)

    // 2. Raw Material Silo Farm & Bulk Storage Battery
    const siloComplex = buildIndustrialSiloComplex(isDark)
    siloComplex.group.position.set(6.5, 0.08, -29.0)
    scene.add(siloComplex.group)
    pickables.push(siloComplex.hitbox)

    // 3. Central Utilities, Cooling Towers & Power Substation
    const utilComplex = buildCoolingTowersAndUtilities(isDark)
    utilComplex.group.position.set(29.0, 0.08, -28.0)
    scene.add(utilComplex.group)
    pickables.push(utilComplex.hitbox)
    const coolingFans = utilComplex.coolingFans || []
    const coolingSteam = utilComplex.steamPlumes || []

    // 4. Internal Material Shuttling Tug (Runs on Rear Logistics Ring Road)
    const materialTug = buildInternalMaterialTug(isDark)
    materialTug.position.set(0, 0.12, -39.0)
    scene.add(materialTug)

    // 5. West Apron Employee & Visitor Parking Lot (16 stalls + 6 cars)
    const matAsphaltParking = new THREE.MeshStandardMaterial({ color: isDark ? 0x172133 : 0x334155, roughness: 0.9 })
    const parkingLot = new THREE.Mesh(new THREE.BoxGeometry(22, 0.12, 34), matAsphaltParking)
    parkingLot.position.set(-46.0, 0.08, -2.0)
    scene.add(parkingLot)

    const parkingSign = makeSignBoard('EMPLOYEE & VISITOR PARKING', 'SLOTS 01-16 · EV FAST-CHARGING BAYS', '#0f172a', '#10b981', 8.5, 1.2)
    parkingSign.position.set(-46.0, 2.8, 14.0)
    scene.add(parkingSign)

    // 6 Parked Personnel Cars with diverse colors
    const carColors = [0x0284c7, 0xdc2626, 0x16a34a, 0xfacc15, 0x64748b, 0x0f172a]
    carColors.forEach((cc, cIdx) => {
      const car = buildParkedCar(cc)
      const isWestSide = cIdx < 3
      const carZ = -10.0 + (cIdx % 3) * 8.0
      car.position.set(isWestSide ? -51.0 : -41.0, 0.12, carZ)
      car.rotation.y = isWestSide ? Math.PI / 2 : -Math.PI / 2
      scene.add(car)
    })

    // Campus Landmarks Label Sprites
    const labelProd = makeLabelSprite('1. UNIT A ASSEMBLY', 'Robotic Welding & High-Bay Machining', isDark)
    labelProd.position.set(-20, 12.5, -12.0)
    const labelDock = makeLabelSprite('2. LOADING DOCK BAYS (01 - 06)', 'Finished Goods Staging & Active Unloading', isDark)
    labelDock.position.set(13, 12.5, -4.0)
    const labelScale = makeLabelSprite('3. WEIGHBRIDGE WB-01', 'Automated Commercial Scale & Yard Marshal', isDark)
    labelScale.position.set(-22, 9.2, 6.5)
    const labelHighway = makeLabelSprite('4. HIGHWAY CORRIDOR', 'Active In-Transit GPS Fleet', isDark)
    labelHighway.position.set(0, 4.5, 29.0)
    const labelDispatch = makeLabelSprite('5. DISPATCH CONTROL TOWER', 'Central Logistics Command & GPS Fleet Telemetry', isDark)
    labelDispatch.position.set(31, 14.2, -5.5)
    const labelGate = makeLabelSprite('6. SECURITY GATE 01', 'FASTag RFID & Document Inspection', isDark)
    labelGate.position.set(-36, 6.5, 6.5)
    const labelStaging = makeLabelSprite('7. STAGING BUFFER YARD', '6 Staging Slots & Queue Allocation', isDark)
    labelStaging.position.set(-2, 6.5, 12.0)
    const labelPlantB = makeLabelSprite('8. PLANT UNIT B (POWERTRAIN)', 'Heavy Stamping, Crankshaft Machining & Welding', isDark)
    labelPlantB.position.set(-20, 14.5, -28.0)
    const labelSilos = makeLabelSprite('9. RAW MATERIALS SILO FARM', 'Resin Silos 01-04 & Bulk Fluid Pressure Tanks', isDark)
    labelSilos.position.set(6.5, 18.0, -29.0)
    const labelUtilities = makeLabelSprite('10. COOLING TOWERS & ENERGY', '1800 TR Induced Draft Chillers & 33KV Substation', isDark)
    labelUtilities.position.set(29.0, 13.0, -28.0)
    const labelParking = makeLabelSprite('11. EMPLOYEE & FLEET PARKING', '16 Stalls · EV Fast Charging Hub', isDark)
    labelParking.position.set(-46.0, 6.0, -2.0)
    scene.add(labelProd, labelDock, labelScale, labelHighway, labelDispatch, labelGate, labelStaging, labelPlantB, labelSilos, labelUtilities, labelParking)

    // ==================== SECURITY CHECKPOINT & MAIN GATE ====================
    const gatehouse = buildSecurityGatehouse(isDark)
    gatehouse.group.position.set(-36.0, 0.08, 6.5)
    scene.add(gatehouse.group)
    pickables.push(gatehouse.hitbox)

    // Security Inspector Officer R. Sekar
    const wSecurityGuard = buildHumanWorker({
      name: 'R. Sekar',
      role: 'Senior Plant Security Inspector',
      department: 'Plant Safety & Security',
      task: 'Driver FASTag Verification & Gate Entry Clearance',
      shift: 'Day Shift A (06:00 - 14:30)',
      vestColor: 0x0284c7,
      hatColor: 0x1e293b,
      tool: 'clipboard',
      isDark,
    })
    wSecurityGuard.group.position.set(-36.0, 0.12, 9.5)
    wSecurityGuard.group.rotation.y = -Math.PI / 2
    scene.add(wSecurityGuard.group)
    pickables.push(wSecurityGuard.hitbox)

    // ==================== VEHICLE STAGING & BUFFER YARD ====================
    const stagingYard = buildVehicleStagingYard(isDark)
    stagingYard.group.position.set(-2.0, 0.08, 12.0)
    scene.add(stagingYard.group)
    pickables.push(stagingYard.hitbox)

    // Waiting Parked Commercial Vehicles in Staging Slots
    // Slot 01: 10-Wheel Heavy Lorry waiting for dock call-up
    const stageTruckData1 = {
      carrier: 'TCI', vehicle_type: '32FT_TRUCK', shipment_id: 'INB-00821', customer_order_id: 'CO-000104',
      shipment_qty: 1250, vehicle_utilization_pct: 94.0, transit_tat_hrs: 24, risk_level: 'LOW',
      recommended_action: 'Staged in Slot 01. Awaiting Bay 04 clearance for finished goods unloading.'
    }
    const stagingTruck1 = build10WheelLorry(stageTruckData1, isDark)
    stagingTruck1.group.position.set(-11.3, 0.12, 12.5)
    stagingTruck1.group.rotation.y = 0.22
    scene.add(stagingTruck1.group)
    pickables.push(stagingTruck1.hitbox)

    // Slot 02: 6-Wheel Medium Lorry
    const stageTruckData2 = {
      carrier: 'BlueDart', vehicle_type: '20FT_TRUCK', shipment_id: 'INB-00959', customer_order_id: 'CO-000088',
      shipment_qty: 850, vehicle_utilization_pct: 88.5, transit_tat_hrs: 18, risk_level: 'MEDIUM',
      recommended_action: 'Priority Inbound Vehicle. Scheduled for immediate Weighbridge sequence.'
    }
    const stagingTruck2 = build6WheelLorry(stageTruckData2, isDark)
    stagingTruck2.group.position.set(-7.5, 0.12, 12.5)
    stagingTruck2.group.rotation.y = 0.22
    scene.add(stagingTruck2.group)
    pickables.push(stagingTruck2.hitbox)

    // Staging Area Yard Coordinator Worker
    const wStagingCoord = buildHumanWorker({
      name: 'K. Mohan',
      role: 'Yard Staging Coordinator',
      department: 'Fleet Logistics & Yard Operations',
      task: 'Directing waiting vehicles from staging slots to Loading Bays 01-06',
      shift: 'Day Shift A',
      vestColor: 0xeab308,
      hatColor: 0xfacc15,
      tool: 'tablet',
      isDark,
    })
    wStagingCoord.group.position.set(-2.0, 0.12, 14.5)
    wStagingCoord.group.rotation.y = Math.PI
    scene.add(wStagingCoord.group)
    pickables.push(wStagingCoord.hitbox)

    // ==================== 5. SIMULATED HERO TRUCK & HIGHWAY FLEET ====================
    const heroData = filteredVehicles[0] || {
      shipment_id: 'SHP-000001', customer_order_id: 'CO-000079', carrier: 'Delhivery',
      vehicle_type: '32FT_TRUCK', shipment_qty: 1475, vehicle_utilization_pct: 92.2,
      transit_tat_hrs: 96, eta_slippage_hrs: 0, shipment_status: 'IN_TRANSIT',
      pod_status: 'PENDING', risk_level: 'MEDIUM', plant_id: 'IN-KA-01', warehouse_id: 'FG-WH-01',
    }
    const heroTruck = build10WheelLorry(heroData, isDark)
    heroTruck.group.position.set(-36.0, 0.12, 6.5)
    scene.add(heroTruck.group)
    pickables.push(heroTruck.hitbox)

    // Highway Corridor Moving Fleet (Lively mix of 10-wheelers, 6-wheelers, Dost mini trucks & semi-trailers)
    const highwayFleet = []
    filteredVehicles.slice(4, 18).forEach((v, idx) => {
      const truck = createLogisticsVehicle(v, isDark)
      const isEastbound = idx % 2 === 0
      const laneZ = isEastbound ? 16.8 : 20.2
      const dir = isEastbound ? 1 : -1
      if (!isEastbound) truck.group.rotation.y = Math.PI

      const phase = (idx * 0.15) % 1.0
      truck.group.position.set(-44 + phase * 88, 0.08, laneZ)
      scene.add(truck.group)
      pickables.push(truck.hitbox)

      highwayFleet.push({
        group: truck.group,
        wheelMeshes: truck.group.userData.wheelMeshes || [],
        vehicle: v,
        dir,
        phase,
        rate: v.shipment_status === 'DELAYED' ? 0.02 : 0.045,
      })
    })

    // Store context for updates
    sceneCtxRef.current = {
      scene,
      camera,
      controls,
      sunLight,
      hemiLight,
      nightLights,
      isDarkBase: isDark,
    }

    // Raycasting for object selection
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const onPointerDown = (e) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(pickables, false)
      if (hits.length > 0) {
        const udata = hits[0].object.userData
        setSelectedItem({ kind: udata.kind, data: udata.data })
      }
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown)

    const onResize = () => {
      if (!container) return
      const w = container.clientWidth || 900
      const h = container.clientHeight || 580
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    // Animation Loop
    let animId = 0
    let cycleT = 0
    let lastWeighState = ''
    const clock = new THREE.Clock()

    const animate = () => {
      animId = requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.05)
      const elapsed = clock.elapsedTime

      if (playingRef.current) {
        cycleT = (cycleT + dt * 0.085 * speedRef.current) % 1.0

        // 1. Traversing Bridge Crane
        craneGroup.position.x = -16 + Math.sin(elapsed * 0.4) * 10

        // 2. Conveyor Belt Moving Cartons
        fgCartons.forEach(c => {
          c.phase = (c.phase + dt * 0.16 * speedRef.current) % 1.0
          c.mesh.position.x = -24 + c.phase * 30
        })

        // 3. Robotic Welding Arms & Sparks
        robotArms.forEach(r => {
          r.pivot.rotation.y = Math.sin(elapsed * 2.4 + r.offset) * 0.8
          r.pivot.rotation.z = Math.sin(elapsed * 3.2 + r.offset) * 0.16
        })
        weldSparks.forEach(w => {
          w.mesh.visible = Math.sin(elapsed * 16 + w.offset) > 0.35
        })

        // 4. Industrial Exhaust Smoke Plumes
        steamPlumes.forEach(s => {
          const st = (elapsed * 0.5 + s.offset) % 1.0
          s.mesh.position.y = 12.0 + st * 5.0
          s.mesh.position.x = s.baseX + st * 1.2
          const sc = 0.8 + st * 1.4
          s.mesh.scale.set(sc, sc, sc)
          s.mesh.material.opacity = 0.45 * (1 - st)
        })

        // 5. Forklift Movement & Pallet Elevation in Warehouse
        forklift.position.x = 6.0 + (Math.sin(elapsed * 0.8) * 0.5 + 0.5) * 12.0
        flPallet.position.y = 0.5 + (Math.sin(elapsed * 1.4) * 0.5 + 0.5) * 1.1

        // 5b. Animate Human Logistics Crew & Dispatch Center
        // Yard Safety Marshal waving neon wands to guide approaching lorry
        if (wMarshal.group.userData.wandL && wMarshal.group.userData.wandR) {
          wMarshal.group.userData.wandL.rotation.z = Math.PI / 4 + Math.sin(elapsed * 4.5) * 0.28
          wMarshal.group.userData.wandR.rotation.z = -Math.PI / 4 - Math.sin(elapsed * 4.5) * 0.28
        }
        // Barcode scanner laser beam pulse
        if (wScan.group.userData.scannerBeam) {
          wScan.group.userData.scannerBeam.scale.y = 0.85 + Math.sin(elapsed * 12) * 0.3
        }
        // Dispatch Operations Center Radar Dish rotation
        if (dispatchCenter.radarDish) {
          dispatchCenter.radarDish.rotation.y = elapsed * 1.5
        }

        // 5c. Animate Rear Plant B, Silos & Utilities
        // Induced-draft cooling tower fans
        coolingFans.forEach(f => {
          f.rotation.y += dt * 14.0 * speedRef.current
        })
        // Rising evaporative steam plumes from cooling towers
        coolingSteam.forEach(s => {
          const st = (elapsed * 0.45 + s.offset) % 1.0
          s.mesh.position.y = 8.2 + st * 4.5
          s.mesh.position.x = s.baseX + Math.sin(elapsed * 0.8 + s.offset) * 0.8
          const sc = 0.9 + st * 1.6
          s.mesh.scale.set(sc, sc, sc)
          s.mesh.material.opacity = 0.4 * (1 - st)
        })
        // Internal material shuttling tug along rear logistics ring road
        const tugSpeed = dt * 10.0 * speedRef.current
        materialTug.position.x += tugSpeed
        if (materialTug.position.x > 54) {
          materialTug.position.x = -54
        }

        // 6. Hero Commercial Truck Plant Simulation Cycle
        if (cycleT < 0.20) {
          // Approaching Weighbridge
          const p = cycleT / 0.20
          heroTruck.group.position.set(-36.0 + p * 8.0, 0.12, 6.5)
          barrierArmPivot.rotation.x = -Math.PI / 2.8 // Open barrier
          scanBeam.visible = false
          wbSignalMat.color.setHex(0x16a34a)
          if (lastWeighState !== 'gate') {
            lastWeighState = 'gate'
            scaleDisplay.draw('GATE VERIFIED', `${heroData.shipment_id} CHECK-IN`, '#38bdf8')
            setWeighStatus(`${heroData.shipment_id} (${heroData.carrier}): Checked In at Security Gate`)
          }
        } else if (cycleT < 0.35) {
          // Positioning on Pit
          const p = (cycleT - 0.20) / 0.15
          heroTruck.group.position.set(-28.0 + p * 6.0, 0.22, 6.5)
          barrierArmPivot.rotation.x = 0 // Close barrier
          scanBeam.visible = false
          wbSignalMat.color.setHex(0xd97706)
          if (lastWeighState !== 'align') {
            lastWeighState = 'align'
            scaleDisplay.draw('POSITIONING..', 'ALIGNING ON WB-01', '#facc15')
            setWeighStatus(`${heroData.shipment_id}: Positioning on Heavy Pit Scale WB-01`)
          }
        } else if (cycleT < 0.65) {
          // Live Weighing Active
          heroTruck.group.position.set(-22.0, 0.22, 6.5)
          scanBeam.visible = true
          scanBeamMat.opacity = 0.2 + Math.abs(Math.sin(elapsed * 8)) * 0.5
          wbSignalMat.color.setHex(0xdc2626)
          const grossTons = (14.2 + Number(heroData.shipment_qty || 1000) * 0.016).toFixed(1)
          if (cycleT < 0.52 && lastWeighState !== 'weighing') {
            lastWeighState = 'weighing'
            scaleDisplay.draw('SCALE READING...', `${grossTons} T GROSS`, '#ea580c')
            setWeighStatus(`${heroData.shipment_id}: Scale reading ${grossTons} Tons...`)
          } else if (cycleT >= 0.52 && lastWeighState !== 'verified') {
            lastWeighState = 'verified'
            wbSignalMat.color.setHex(0x16a34a)
            scaleDisplay.draw(`${grossTons} T VERIFIED`, `UTIL ${Number(heroData.vehicle_utilization_pct || 80).toFixed(0)}% · PASS`, '#16a34a')
            setWeighStatus(`${heroData.shipment_id}: Weight Verified (${grossTons}T) -> Cleared for Loading Docks`)
          }
        } else {
          // Cleared Scale -> Outbound
          const p = (cycleT - 0.65) / 0.35
          heroTruck.group.position.set(-22.0 + p * 60.0, 0.12, 6.5)
          barrierArmPivot.rotation.x = -Math.PI / 2.8
          scanBeam.visible = false
          wbSignalMat.color.setHex(0x16a34a)
          if (lastWeighState !== 'cleared') {
            lastWeighState = 'cleared'
            scaleDisplay.draw('SCALE CLEARED', 'NEXT VEHICLE INBOUND', '#2dd4bf')
            setWeighStatus(`${heroData.shipment_id}: Cleared WB-01 -> Dispatched to Assigned Loading Bay`)
          }
        }

        // Rotate Hero Truck Wheels while moving
        if (heroTruck.group.userData.wheelMeshes) {
          const moveSpeed = (cycleT >= 0.35 && cycleT < 0.65) ? 0 : 0.25
          heroTruck.group.userData.wheelMeshes.forEach(w => {
            w.children.forEach(c => { c.rotation.y += moveSpeed })
          })
        }

        // 7. Highway Fleet Movement & Wheel Rotation
        highwayFleet.forEach(item => {
          item.phase = (item.phase + dt * item.rate * speedRef.current) % 1.0
          const xPos = item.dir > 0 ? -48 + item.phase * 96 : 48 - item.phase * 96
          item.group.position.x = xPos
          item.wheelMeshes.forEach(w => {
            w.children.forEach(c => { c.rotation.y += dt * 10 * item.dir })
          })
        })
      }

      // Drone smooth camera interpolation
      if (targetCamPosRef.current && targetControlsTargetRef.current) {
        camera.position.lerp(targetCamPosRef.current, Math.min(1, dt * 4.0))
        controls.target.lerp(targetControlsTargetRef.current, Math.min(1, dt * 4.0))
        if (camera.position.distanceTo(targetCamPosRef.current) < 0.15 && controls.target.distanceTo(targetControlsTargetRef.current) < 0.15) {
          targetCamPosRef.current = null
          targetControlsTargetRef.current = null
        }
      }

      // Continuous 360-degree auto-rotation when toggled
      if (autoOrbitRef.current && controls) {
        controls.autoRotate = true
        controls.autoRotateSpeed = 1.2 * speedRef.current
      } else if (controls) {
        controls.autoRotate = false
      }

      controls.update()
      renderer.render(scene, camera)
    }

    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [theme, plantFocus, riskFilter])

  return (
    <div className="digital-twin-shell" style={{ position: 'relative', width: '100%', height: 'calc(100vh - 58px)', minHeight: '750px', background: 'var(--bg-main)' }}>
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* ===================== CLEAN VIEW TOGGLE (FLOATING WHEN CLEAN MODE ACTIVE) ===================== */}
      {cleanView && (
        <button
          type="button"
          onClick={() => setCleanView(false)}
          className="btn-primary"
          style={{
            position: 'absolute',
            top: '14px',
            right: '16px',
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            fontSize: '11px',
            fontWeight: 700,
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
          title="Exit Clean 3D View and restore all HUD controls"
        >
          <Eye size={13} />
          <span>Exit Clean View</span>
        </button>
      )}

      {/* ===================== SLIM TOP FLOATING STATUS BAR ===================== */}
      {!cleanView && (
        <div
          className="twin-hud-container"
          style={{
            position: 'absolute',
            top: '12px',
            left: '16px',
            right: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            background: 'var(--bg-card, rgba(255, 255, 255, 0.94))',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '11px',
            padding: '6px 14px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
            zIndex: 20,
            pointerEvents: 'auto',
          }}
        >
          {/* Left Plant Scope & Zone Jump Navigator (Integrated, Zero Overlap!) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
            {/* Zone Jump Toggle Button */}
            <button
              type="button"
              onClick={() => setSideNavCollapsed(!sideNavCollapsed)}
              className={!sideNavCollapsed ? 'btn-primary' : 'btn-secondary'}
              style={{
                height: '30px',
                padding: '0 10px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              title="Toggle Campus Zone Jump Navigator (11 Zones)"
            >
              <Compass size={14} color={!sideNavCollapsed ? '#fff' : 'var(--teal)'} />
              <span>Zone Jump ({CAMPUS_ZONES.length})</span>
              {sideNavCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </button>

            {/* Separator */}
            <div style={{ width: '1px', height: '18px', background: 'var(--border-color)' }} />

            {/* Plant Scope Selector Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'linear-gradient(135deg, #0d9488, #0284c7)', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(13, 148, 136, 0.35)' }}>
                <Factory size={15} />
              </div>
              <select
                value={plantFocus}
                onChange={(e) => setPlantFocus(e.target.value)}
                className="filter-select"
                style={{
                  height: '30px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  padding: '0 10px',
                  borderRadius: '7px',
                  background: 'var(--bg-subtle, #f8fafc)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  minWidth: '220px',
                }}
                title="Select Manufacturing Plant Scope"
              >
                <option value="ALL">🏭 Apex Complex (All Plants)</option>
                <option value="IN-KA-01">🏭 KA-01 (Bengaluru Assembly)</option>
                <option value="IN-TN-01">🏭 TN-01 (Chennai Powertrain)</option>
              </select>
            </div>

            {/* Live Badges */}
            <span className="live-tag" style={{ background: '#dcfce7', color: '#15803d', fontSize: '9px', padding: '2px 7px', fontWeight: 700 }}>
              ● 360° LIVE
            </span>
            <span className="live-tag" style={{ background: 'rgba(14, 165, 233, 0.12)', color: '#0284c7', fontSize: '9px', padding: '2px 7px', fontWeight: 700 }}>
              {filteredVehicles.length} FLEET
            </span>
          </div>

          {/* Right Action Hub: Shift Lighting, 360° Controls, Presets, Simulation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
            {/* Day / Night Shift Lighting Toggle */}
            <button
              type="button"
              onClick={() => setShiftMode(shiftMode === 'day' ? 'night' : 'day')}
              className="btn-secondary"
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                height: '28px',
                background: shiftMode === 'night' ? '#0f172a' : '#fef3c7',
                color: shiftMode === 'night' ? '#38bdf8' : '#b45309',
                borderColor: shiftMode === 'night' ? '#38bdf8' : '#f59e0b',
                fontWeight: 600,
              }}
              title="Toggle between Day Shift sunlight and Night Shift high-mast floodlights"
            >
              {shiftMode === 'night' ? <Moon size={12} /> : <Sun size={12} />}
              <span>{shiftMode === 'night' ? 'Night Shift' : 'Day Shift'}</span>
            </button>

            {/* 360° Quick-Turn Cluster */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'var(--bg-subtle, #f1f5f9)', padding: '2px 4px', borderRadius: '7px', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => rotateCamera(90)}
                className="icon-btn"
                style={{ padding: '2px 5px', height: '24px', fontSize: '10px' }}
                title="Rotate Camera 90° Left"
              >
                <RotateCcw size={12} />
              </button>
              <button
                type="button"
                onClick={() => rotateCamera(-90)}
                className="icon-btn"
                style={{ padding: '2px 5px', height: '24px', fontSize: '10px' }}
                title="Rotate Camera 90° Right"
              >
                <RotateCw size={12} />
              </button>
              <button
                type="button"
                onClick={() => rotateCamera(180)}
                className="btn-secondary"
                style={{ padding: '2px 6px', height: '24px', fontSize: '10px', fontWeight: 700 }}
                title="Flip 180° to Rear Facilities (Plant B, Silos & Utilities)"
              >
                <RefreshCw size={10} /> 180° Rear
              </button>
              <button
                type="button"
                onClick={() => setAutoOrbit(!autoOrbit)}
                className={autoOrbit ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '2px 6px', height: '24px', fontSize: '10px', fontWeight: 700 }}
                title="Toggle continuous smooth 360° panoramic auto-rotation"
              >
                360° Orbit {autoOrbit ? '● ON' : ''}
              </button>
            </div>

            {/* Camera Perspectives Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Camera size={13} color="var(--text-muted)" />
              <select
                value={cameraPreset}
                onChange={(e) => setCameraPreset(e.target.value)}
                className="filter-select"
                style={{ height: '28px', fontSize: '11px', padding: '0 6px' }}
                title="Camera Perspectives & Drone Angles"
              >
                {Object.entries(CAMERA_PRESETS).map(([k, p]) => (
                  <option key={k} value={k}>🎥 {p.label}</option>
                ))}
              </select>
            </div>

            {/* Clean View Toggle */}
            <button
              type="button"
              onClick={() => setCleanView(true)}
              className="btn-secondary"
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                height: '28px',
                fontWeight: 600,
              }}
              title="Hide all UI overlays for an unobstructed, presentation-grade 3D view"
            >
              <Eye size={12} />
              <span>Clean 3D</span>
            </button>

            {/* Play / Pause simulation */}
            <button
              type="button"
              onClick={() => setPlaying(!playing)}
              className="btn-secondary"
              style={{ padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', height: '28px' }}
              title="Pause or Resume vehicle & robotic machinery simulation"
            >
              {playing ? <Pause size={12} /> : <Play size={12} />}
              <span>{playing ? 'Pause' : 'Play'}</span>
            </button>

            {/* Telemetry HUD toggle */}
            <button
              type="button"
              onClick={() => setShowTelemetryHud(!showTelemetryHud)}
              className={showTelemetryHud ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', height: '28px' }}
              title="Inspect live yard & vehicle telemetry sheet"
            >
              <Activity size={12} />
              <span>Telemetry</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================== SLEEK LEFT-HAND FLOATING ZONE & LAYER DOCK ===================== */}
      {!cleanView && !sideNavCollapsed && (
        <div
          className="twin-side-rail"
          style={{
            position: 'absolute',
            top: '56px',
            left: '16px',
            bottom: '48px',
            width: '190px',
            background: 'var(--bg-card, rgba(255, 255, 255, 0.95))',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '12px',
            padding: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 15,
            overflow: 'hidden',
          }}
        >
            {/* Side Rail Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Compass size={13} color="var(--teal)" /> ZONE JUMP
              </span>
              <button
                type="button"
                onClick={() => setSideNavCollapsed(true)}
                className="icon-btn"
                style={{ padding: '2px', height: '20px', width: '20px' }}
                title="Collapse Zone Jump panel to keep 3D view wide open"
              >
                <ChevronLeft size={13} />
              </button>
            </div>

            {/* Scrollable Zone List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, overflowY: 'auto', paddingRight: '2px' }}>
              {CAMPUS_ZONES.map(z => {
                const Icon = z.icon
                const isActive = activeZoneId === z.id
                return (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => {
                      setCameraPreset('')
                      setActiveZoneId(z.id)
                      flyTo(z.pos, z.target)
                    }}
                    className={isActive ? 'btn-primary' : 'btn-secondary'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '5px 7px',
                      fontSize: '10.5px',
                      fontWeight: isActive ? 700 : 500,
                      borderRadius: '6px',
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      width: '100%',
                      transition: 'all 0.15s ease',
                      border: isActive ? '1px solid var(--teal)' : '1px solid transparent',
                    }}
                    title={`Focus camera on ${z.label}`}
                  >
                    <Icon size={12} color={isActive ? '#ffffff' : 'var(--teal)'} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{z.label}</span>
                  </button>
                )
              })}
            </div>

            {/* 3D Layer Visibility Controls */}
            <div style={{ paddingTop: '6px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '9.5px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Layers size={10} /> 3D VISIBILITY LAYERS
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {[
                  { key: 'buildings', label: 'Bldgs' },
                  { key: 'vehicles', label: 'Fleet' },
                  { key: 'employees', label: 'Crew' },
                  { key: 'infra', label: 'Infra' },
                  { key: 'labels', label: 'Labels' },
                ].map(l => (
                  <button
                    key={l.key}
                    type="button"
                    onClick={() => setLayers(prev => ({ ...prev, [l.key]: !prev[l.key] }))}
                    style={{
                      flex: '1 1 40%',
                      padding: '3px 4px',
                      borderRadius: '5px',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      border: '1px solid var(--border-color)',
                      background: layers[l.key] ? 'var(--teal)' : 'transparent',
                      color: layers[l.key] ? '#ffffff' : 'var(--text-muted)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    title={`Toggle ${l.label} 3D layer visibility`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* ===================== BOTTOM LEGEND & CAMPUS SUMMARY ===================== */}
      {!cleanView && (
        <div
          style={{
            position: 'absolute',
            bottom: '14px',
            left: sideNavCollapsed ? '16px' : '208px',
            transition: 'left 0.25s ease',
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '10px',
            padding: '6px 12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '10.5px',
            color: 'var(--text-secondary)',
            flexWrap: 'wrap',
            zIndex: 9,
          }}
        >
          <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>REALISTIC FLEET &amp; CREW:</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <i style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#f59e0b', border: '1px solid #d97706', display: 'inline-block' }} /> 10-Wheel Heavy Lorry (Taurus 25T)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <i style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#0284c7', display: 'inline-block' }} /> 6-Wheel Medium Lorry (Tata 1109)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <i style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#10b981', display: 'inline-block' }} /> Dost Mini Truck (LCV Intra-Plant)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <i style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#6366f1', display: 'inline-block' }} /> Class-8 Container Semi-Trailer
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Users size={12} color="#f97316" /> Crew &amp; Yard Marshal
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Building2 size={12} color="#0284c7" /> Dispatch Tower
          </span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ color: 'var(--teal)', fontWeight: 600 }}>💡 Click any vehicle, building, or worker to inspect live telemetry</span>
        </div>
      )}

      {/* ===================== RIGHT TELEMETRY HUD SIDEBAR ===================== */}
      {!cleanView && showTelemetryHud && selectedItem && (
        <div
          className="twin-telemetry-hud"
          style={{
            position: 'absolute',
            top: '74px',
            right: '20px',
            width: '320px',
            maxHeight: 'calc(100% - 90px)',
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(14, 165, 233, 0.12)', color: '#0284c7', display: 'grid', placeItems: 'center' }}>
                {selectedItem.kind === 'vehicle' ? <Truck size={16} /> :
                 selectedItem.kind === 'warehouse' ? <Warehouse size={16} /> :
                 selectedItem.kind === 'worker' ? <Users size={16} /> :
                 selectedItem.kind === 'dispatch' ? <Building2 size={16} /> :
                 selectedItem.kind === 'security' ? <ShieldCheck size={16} /> :
                 selectedItem.kind === 'staging' ? <Truck size={16} /> :
                 <Factory size={16} />}
              </div>
              <div>
                <b style={{ fontSize: '13px', display: 'block', color: 'var(--text-primary)' }}>
                  {selectedItem.kind === 'vehicle' ? selectedItem.data?.shipment_id || 'Vehicle Telemetry' :
                   selectedItem.kind === 'warehouse' ? 'FG High-Bay Warehouse' :
                   selectedItem.kind === 'worker' ? selectedItem.data?.name || 'Logistics Personnel' :
                   selectedItem.kind === 'dispatch' ? 'Dispatch Command Tower' :
                   selectedItem.kind === 'security' ? 'Security Gate 01' :
                   selectedItem.kind === 'staging' ? 'Staging Buffer Yard' :
                   selectedItem.data?.zone || 'Campus Zone'}
                </b>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {selectedItem.kind === 'vehicle' ? `${selectedItem.data?.carrier || 'Carrier'} · ${selectedItem.data?.vehicle_type || '32FT_TRUCK'}` :
                   selectedItem.kind === 'worker' ? `${selectedItem.data?.role || 'Staff'}` :
                   selectedItem.kind === 'dispatch' ? 'Central Operations Hub' :
                   selectedItem.kind === 'security' ? 'FASTag RFID Checkpoint' :
                   selectedItem.kind === 'staging' ? 'Slots 01 - 06 Staging Area' :
                   'Live IoT Telemetry Node'}
                </span>
              </div>
            </div>
            <button className="icon-btn" onClick={() => setSelectedItem(null)} style={{ padding: '2px' }}>
              <X size={15} />
            </button>
          </div>

          {/* Worker / Personnel Telemetry Card */}
          {selectedItem.kind === 'worker' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Employee Name:</span>
                <b>{selectedItem.data?.name}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Designation:</span>
                <b style={{ color: '#0ea5e9' }}>{selectedItem.data?.role}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Department:</span>
                <b>{selectedItem.data?.department}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Current Shift:</span>
                <b>{selectedItem.data?.shift}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Operational Task:</span>
                <b style={{ color: 'var(--text-primary)', textAlign: 'right', maxWidth: '170px' }}>{selectedItem.data?.task}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Safety Compliance:</span>
                <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '10px', background: 'rgba(22, 163, 74, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                  ✓ 100% PPE COMPLIANT
                </span>
              </div>
              <div style={{ marginTop: '8px', padding: '10px', background: 'var(--bg-subtle)', borderRadius: '7px', border: '1px solid var(--border-color)' }}>
                <b style={{ fontSize: '10.5px', color: 'var(--teal)', display: 'block', marginBottom: '2px' }}>Live Activity Status:</b>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                  Active on floor. Coordinated via wireless RF handheld network with WMS Loading Bay allocation system.
                </span>
              </div>
            </div>
          )}

          {/* Dispatch Operations Command Tower Telemetry Card */}
          {selectedItem.kind === 'dispatch' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Facility:</span>
                <b>{selectedItem.data?.center}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Facility Code:</span>
                <b style={{ color: '#0ea5e9' }}>{selectedItem.data?.facility_code}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Shift Supervisor:</span>
                <b>{selectedItem.data?.shift_supervisor}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>On-Duty Staff:</span>
                <b>{selectedItem.data?.active_coordinators} Logistics Coordinators</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Connected IoT Nodes:</span>
                <span style={{ color: 'var(--teal)', fontWeight: 600, fontSize: '10px', textAlign: 'right', maxWidth: '170px' }}>{selectedItem.data?.connected_systems}</span>
              </div>
              <div style={{ marginTop: '8px', padding: '10px', background: 'var(--bg-subtle)', borderRadius: '7px', border: '1px solid var(--border-color)' }}>
                <b style={{ fontSize: '10.5px', color: '#0284c7', display: 'block', marginBottom: '2px' }}>Live Fleet Throughput:</b>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                  {selectedItem.data?.live_metrics}
                </span>
              </div>
            </div>
          )}

          {selectedItem.kind === 'vehicle' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Customer Order:</span>
                <b>{selectedItem.data?.customer_order_id || 'CO-000079'}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Vehicle Type:</span>
                <b style={{ color: '#0284c7', fontSize: '11px', textAlign: 'right' }}>
                  {selectedItem.data?.display_type || (
                    selectedItem.data?.vehicle_type === '32FT_TRUCK' ? '10-Wheel Heavy Lorry (Taurus 25T)' :
                    selectedItem.data?.vehicle_type === '20FT_TRUCK' ? '6-Wheel Medium Lorry (Tata 1109)' :
                    selectedItem.data?.vehicle_type === 'VAN' ? 'Dost Mini Truck (LCV Intra-Plant)' :
                    'Class-8 Heavy Semi-Trailer'
                  )}
                </b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Carrier Partner:</span>
                <b style={{ color: '#0ea5e9' }}>{selectedItem.data?.carrier || 'Delhivery'}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Estimated Weight:</span>
                <b>{selectedItem.data?.shipment_qty ? `${(Number(selectedItem.data.shipment_qty) * 0.018 + 14).toFixed(1)} Tons Gross` : '28.4 Tons'}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Capacity Utilization:</span>
                <b>{selectedItem.data?.vehicle_utilization_pct ? `${Number(selectedItem.data.vehicle_utilization_pct).toFixed(1)}%` : '92.2%'}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Corridor TAT Elapsed:</span>
                <b>{selectedItem.data?.transit_tat_hrs || 48} hrs</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Risk Status:</span>
                <span className={`risk-pill ${selectedItem.data?.risk_level || 'LOW'}`}>{selectedItem.data?.risk_level || 'LOW'}</span>
              </div>

              <div style={{ marginTop: '8px', padding: '10px', background: 'var(--bg-subtle)', borderRadius: '7px', border: '1px solid var(--border-color)' }}>
                <b style={{ fontSize: '10.5px', color: 'var(--teal)', display: 'block', marginBottom: '2px' }}>AI Agent Recommendation:</b>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                  {selectedItem.data?.recommended_action || 'Cleared for dock staging. Verified tare weight within permissible axle limits.'}
                </span>
              </div>
            </div>
          )}

          {selectedItem.kind === 'warehouse' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Facility Code:</span>
                <b>{selectedItem.data?.warehouse_id || 'FG-WH-01'}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Plant Scope:</span>
                <b>{selectedItem.data?.plant_id || 'IN-KA-01'}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>On-Hand Inventory:</span>
                <b>{fmt(selectedItem.data?.on_hand_qty || 42000)} units</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>QA Released Net Avail:</span>
                <b style={{ color: '#16a34a' }}>{fmt(selectedItem.data?.net_available_qty || 32450)} units</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Loading Bays:</span>
                <b>6 Bays Active (Bays 1-6)</b>
              </div>

              <div style={{ marginTop: '8px', padding: '10px', background: 'var(--bg-subtle)', borderRadius: '7px', border: '1px solid var(--border-color)' }}>
                <b style={{ fontSize: '10.5px', color: '#0ea5e9', display: 'block', marginBottom: '2px' }}>Staging Readiness:</b>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                  Sufficient palletized inventory to fulfill 18 immediate P1 dispatches without stockout risk.
                </span>
              </div>
            </div>
          )}

          {selectedItem.kind === 'zone' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Operational Purpose:</span>
              </div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedItem.data?.purpose}</div>
              <div style={{ marginTop: '8px', padding: '10px', background: 'var(--bg-subtle)', borderRadius: '7px', border: '1px solid var(--border-color)' }}>
                <b style={{ fontSize: '10.5px', color: 'var(--teal)', display: 'block', marginBottom: '2px' }}>Operational Note:</b>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                  {selectedItem.data?.note}
                </span>
              </div>
            </div>
          )}

          {/* Security Gate Checkpoint Telemetry */}
          {selectedItem.kind === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Security Checkpoint:</span>
                <b>{selectedItem.data?.zone}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Duty Officer:</span>
                <b style={{ color: '#0ea5e9' }}>{selectedItem.data?.officer}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Shift Hours:</span>
                <b>{selectedItem.data?.duty_hours}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>FASTag RFID Rate:</span>
                <b style={{ color: '#16a34a' }}>{selectedItem.data?.rfid_scan_rate}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Daily Cleared Trucks:</span>
                <b>{selectedItem.data?.daily_cleared_trucks} commercial vehicles</b>
              </div>
              <div style={{ marginTop: '8px', padding: '10px', background: 'var(--bg-subtle)', borderRadius: '7px', border: '1px solid var(--border-color)' }}>
                <b style={{ fontSize: '10.5px', color: 'var(--teal)', display: 'block', marginBottom: '2px' }}>Checkpoint Operational Note:</b>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                  {selectedItem.data?.note}
                </span>
              </div>
            </div>
          )}

          {/* Vehicle Staging Yard Telemetry */}
          {selectedItem.kind === 'staging' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Yard Facility:</span>
                <b>{selectedItem.data?.zone}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Staging Slots:</span>
                <b>{selectedItem.data?.total_slots} slots (Angled)</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Occupancy Status:</span>
                <b style={{ color: '#f59e0b' }}>{selectedItem.data?.occupied_slots} / {selectedItem.data?.total_slots} Occupied ({selectedItem.data?.available_slots} Open)</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Average Dwell Time:</span>
                <b>{selectedItem.data?.avg_dwell_minutes} mins</b>
              </div>
              <div style={{ marginTop: '8px', padding: '10px', background: 'var(--bg-subtle)', borderRadius: '7px', border: '1px solid var(--border-color)' }}>
                <b style={{ fontSize: '10.5px', color: '#0ea5e9', display: 'block', marginBottom: '2px' }}>Staging Strategy:</b>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                  {selectedItem.data?.note}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
