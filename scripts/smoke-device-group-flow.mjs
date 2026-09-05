const apiBaseUrl = process.env.ENERGYCORE_API_URL ?? 'http://localhost:8080/api/v1';
const timestamp = Date.now();
const email = process.env.ENERGYCORE_SMOKE_EMAIL ?? `smoke.group.${timestamp}@gmail.com`;
const password = process.env.ENERGYCORE_SMOKE_PASSWORD ?? 'SmokePass123';

let token = '';

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const details = body ? JSON.stringify(body) : response.statusText;
    throw new Error(`${options.method ?? 'GET'} ${path} failed: ${response.status} ${details}`);
  }

  return body;
}

async function signUpOrSignIn() {
  try {
    const auth = await request('/auth/sign-up', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Smoke Device Group',
        email,
        password,
      }),
    });

    token = auth.token;
    return;
  } catch (error) {
    if (!process.env.ENERGYCORE_SMOKE_EMAIL) {
      throw error;
    }
  }

  const auth = await request('/auth/sign-in', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  token = auth.token;
}

async function createDevice(name, room, type, powerWatts) {
  return request('/devices', {
    method: 'POST',
    body: JSON.stringify({
      name,
      room,
      type,
      powerWatts,
    }),
  });
}

async function main() {
  console.log(`EnergyCore smoke flow: ${apiBaseUrl}`);
  await signUpOrSignIn();

  const location = await request('/workplace/locations', {
    method: 'POST',
    body: JSON.stringify({
      name: `Sede smoke ${timestamp}`,
      address: 'Smoke Lab',
      type: 'HOME',
    }),
  });

  const room = await request('/workplace/rooms', {
    method: 'POST',
    body: JSON.stringify({
      locationId: location.id,
      name: 'Habitacion smoke',
      floor: '1',
    }),
  });

  const devices = await Promise.all([
    createDevice('Smoke interruptor principal', room.name, 'SWITCH', 60),
    createDevice('Smoke lampara de sala', room.name, 'LIGHT', 12),
    createDevice('Smoke sensor de movimiento', room.name, 'SENSOR', 5),
  ]);

  await Promise.all(
    devices.map((device) =>
      request('/workplace/device-assignments', {
        method: 'POST',
        body: JSON.stringify({
          deviceId: device.id,
          locationId: location.id,
          roomId: room.id,
        }),
      })
    )
  );

  const group = await request('/device-groups', {
    method: 'POST',
    body: JSON.stringify({
      name: `Grupo smoke ${timestamp}`,
      description: 'Grupo creado por smoke test local',
      deviceIds: devices.map((device) => device.id),
    }),
  });

  const groups = await request('/device-groups');
  const groupWasPersisted = groups.some((item) => item.id === group.id);

  if (!groupWasPersisted) {
    throw new Error('The created group was not returned by GET /device-groups.');
  }

  console.log('Smoke device group flow OK');
  console.table({
    email,
    locationId: location.id,
    roomId: room.id,
    deviceIds: devices.map((device) => device.id).join(', '),
    groupId: group.id,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
