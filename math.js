// Referencing http://bl.ocks.org/ivyywang/7c94cb5a3accd9913263
const radians = Math.PI / 180
const degrees = 180 / Math.PI

const sin = Math.sin
const cos = Math.cos

function crossProduct(a, b) {
  return [ 
    a[1] * b[2] - a[2] * b[1], 
    a[2] * b[0] - a[0] * b[2], 
    a[0] * b[1] - a[1] * b[0]
  ]
}

function dotProduct(a, b) {
  let sum = 0
  //sum = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  
  for (i=0; i < a.length; i++) {
    sum += a[i] * b[i]
  }  
  
  return sum
}

function SphericalToCartesian(coord) {
  let lon = coord[0] * radians
  let lat = coord[1] * radians
  
  // NOTE: latitude starts at equator => theta+pi/2 => sin/cos flip
  let x = cos(lat) * cos(lon)
  let y = cos(lat) * sin(lon)
  let z = sin(lat)
  
  return [x, y, z]
}

function quaternion(a ,b) {
  let ev = crossProduct(a, b)
  let el = Math.sqrt(dotProduct(ev, ev))
  
  if (el) {  
    let theta = Math.acos(Math.max(-1, Math.min(1, dotProduct(a, b)))) / 2
    
    // NOTE: why is ev inverted?
    let qr = cos(theta)
    let qi =  ev[2] / el * sin(theta) 
    let qj = -ev[1] / el * sin(theta)
    let qk =  ev[0] / el * sin(theta) 
    
    return [qr, qi, qj, qk]
  }
}

function EulerToQuaternion(e) {
  let phi   = e[0] / 2 * radians
  let theta = e[1] / 2 * radians
  let psi   = e[2] / 2 * radians  
  
  let qr = cos(phi) * cos(theta) * cos(psi) + sin(phi) * sin(theta) * sin(psi)
  let qi = sin(phi) * cos(theta) * cos(psi) - cos(phi) * sin(theta) * sin(psi)  
  let qj = cos(phi) * sin(theta) * cos(psi) + sin(phi) * cos(theta) * sin(psi)  
  let qk = cos(phi) * cos(theta) * sin(psi) - sin(phi) * sin(theta) * cos(psi)
  
  return [qr, qi, qj, qk]    
}

function QuaternionToEuler(q) {
  let phi   = Math.atan2(2 * (q[0] * q[1] + q[2] * q[3]), 1 - 2 * (q[1] * q[1] + q[2] * q[2])) * degrees
  let theta = Math.asin(Math.max(-1, Math.min(1, 2 * (q[0] * q[2] - q[3] * q[1])))) * degrees
  let psi   = Math.atan2(2 * (q[0] * q[3] + q[1] * q[2]), 1 - 2 * (q[2] * q[2] + q[3] * q[3])) * degrees
  
  return [phi, theta, psi]
}

function QuaternionMultiply(qa, qb) {  
  let qr = qa[0] * qb[0] - qa[1] * qb[1] - qa[2] * qb[2] - qa[3] * qb[3]
  let qi = qa[0] * qb[1] + qa[1] * qb[0] + qa[2] * qb[3] - qa[3] * qb[2]
  let qj = qa[0] * qb[2] - qa[1] * qb[3] + qa[2] * qb[0] + qa[3] * qb[1]
  let qk = qa[0] * qb[3] + qa[1] * qb[2] - qa[2] * qb[1] + qa[3] * qb[0]
  
  return [qr, qi, qj, qk]
}

function getEulerAngles(a, b, e0) {
  let cartA = SphericalToCartesian(a)
  let cartB = SphericalToCartesian(b)
  let q0    = EulerToQuaternion(e0)
  
  let q1 = quaternion(cartA, cartB)
  let t = QuaternionMultiply(q0, q1)
  
  return QuaternionToEuler(t)
}