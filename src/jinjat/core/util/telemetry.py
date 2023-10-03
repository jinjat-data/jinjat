import time
import uuid

import requests
import json
import platform
import pkg_resources

session_id = int(time.time() * 1000)


async def record(event_type: str, parameters: dict):
    data = {
        "api_key": "eb5b47ed4df7034812ec46e02141242f",
        "events": [{
            "device_id": str(uuid.UUID(int=uuid.getnode())),
            "event_type": event_type,
            "event_properties": parameters,
            "session_id": session_id,
            "os_name": platform.system(),
            "os_version": platform.release(),
            "app_version": pkg_resources.get_distribution('jinjat').version,
        }]
    }

    requests.post('https://api2.amplitude.com/2/httpapi',
                  headers={
                      'Content-Type': 'application/json',
                  }, data=json.dumps(data))
