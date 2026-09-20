import requests
import math
from typing import List, Dict, Any, Tuple
from app.algorithms.green_corridor import haversine_distance_meters

def generate_interpolated_route(
    start_lat: float,
    start_lon: float,
    end_lat: float,
    end_lon: float,
    num_steps: int = 30
) -> List[List[float]]:
    """
    Generates a realistic urban multi-segment route between two GPS coordinates,
    with city-grid turn simulation.
    """
    route = []
    # Midpoint with slight grid jog
    mid_lat = (start_lat + end_lat) / 2.0
    mid_lon = (start_lon + end_lon) / 2.0
    
    # First leg: start -> corner point 1
    corner_lat = start_lat + (end_lat - start_lat) * 0.4
    corner_lon = start_lon + (end_lon - start_lon) * 0.1
    
    # Second leg: corner point 1 -> corner point 2
    corner2_lat = start_lat + (end_lat - start_lat) * 0.7
    corner2_lon = start_lon + (end_lon - start_lon) * 0.85

    waypoints = [
        (start_lat, start_lon),
        (corner_lat, corner_lon),
        (corner2_lat, corner2_lon),
        (end_lat, end_lon)
    ]

    for i in range(len(waypoints) - 1):
        p1 = waypoints[i]
        p2 = waypoints[i + 1]
        steps = max(5, num_steps // (len(waypoints) - 1))
        for step in range(steps):
            frac = step / float(steps)
            lat = p1[0] + (p2[0] - p1[0]) * frac
            lon = p1[1] + (p2[1] - p1[1]) * frac
            route.append([round(lat, 6), round(lon, 6)])
            
    route.append([round(end_lat, 6), round(end_lon, 6)])
    return route

from app.config import settings

def calculate_route(
    start_lat: float,
    start_lon: float,
    end_lat: float,
    end_lon: float
) -> Dict[str, Any]:
    """
    Calculates route using OpenRouteService or Google Directions (if API keys present),
    falling back to OSRM and simulated urban grid.
    """
    # 1. Try OpenRouteService if API key configured
    if settings.OPENROUTESERVICE_API_KEY:
        try:
            ors_url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson"
            headers = {
                "Authorization": settings.OPENROUTESERVICE_API_KEY,
                "Content-Type": "application/json"
            }
            body = {
                "coordinates": [[start_lon, start_lat], [end_lon, end_lat]]
            }
            resp = requests.post(ors_url, json=body, headers=headers, timeout=3.0)
            if resp.status_code == 200:
                data = resp.json()
                features = data.get("features", [])
                if features:
                    geom = features[0]["geometry"]["coordinates"] # [lon, lat]
                    coords = [[c[1], c[0]] for c in geom]
                    summary = features[0]["properties"]["summary"]
                    dist_km = round(summary["distance"] / 1000.0, 2)
                    duration_min = round(summary["duration"] / 60.0, 1)
                    return {
                        "source": "OPENROUTESERVICE_API",
                        "coordinates": coords,
                        "distance_km": dist_km,
                        "duration_minutes": duration_min,
                        "traffic_level": "OPTIMIZED"
                    }
        except Exception:
            pass

    # 2. Try Google Maps Directions API if API key configured
    if settings.GOOGLE_MAPS_API_KEY:
        try:
            g_url = f"https://maps.googleapis.com/maps/api/directions/json?origin={start_lat},{start_lon}&destination={end_lat},{end_lon}&key={settings.GOOGLE_MAPS_API_KEY}"
            resp = requests.get(g_url, timeout=3.0)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "OK" and data.get("routes"):
                    leg = data["routes"][0]["legs"][0]
                    # Sample step points
                    coords = []
                    for step in leg.get("steps", []):
                        s_lat = step["start_location"]["lat"]
                        s_lng = step["start_location"]["lng"]
                        coords.append([s_lat, s_lng])
                    coords.append([end_lat, end_lon])
                    dist_km = round(leg["distance"]["value"] / 1000.0, 2)
                    duration_min = round(leg["duration"]["value"] / 60.0, 1)
                    return {
                        "source": "GOOGLE_MAPS_DIRECTIONS",
                        "coordinates": coords,
                        "distance_km": dist_km,
                        "duration_minutes": duration_min,
                        "traffic_level": "MODERATE"
                    }
        except Exception:
            pass

    # 3. Try OSRM (Open Source Routing Machine)
    try:
        url = f"https://router.project-osrm.org/route/v1/driving/{start_lon},{start_lat};{end_lon},{end_lat}?overview=full&geometries=geojson"
        resp = requests.get(url, timeout=2.5)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("code") == "Ok" and data.get("routes"):
                osrm_route = data["routes"][0]
                geometry = osrm_route["geometry"]["coordinates"] # [lon, lat]
                # Convert to [lat, lon]
                coords = [[c[1], c[0]] for c in geometry]
                dist_km = round(osrm_route["distance"] / 1000.0, 2)
                duration_min = round(osrm_route["duration"] / 60.0, 1)
                return {
                    "source": "OSRM",
                    "coordinates": coords,
                    "distance_km": dist_km,
                    "duration_minutes": duration_min,
                    "traffic_level": "MODERATE"
                }
    except Exception:
        pass

    # Fallback to simulated route
    coords = generate_interpolated_route(start_lat, start_lon, end_lat, end_lon, num_steps=35)
    total_m = 0.0
    for i in range(len(coords) - 1):
        total_m += haversine_distance_meters(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1])
    
    dist_km = round(total_m / 1000.0, 2)
    duration_min = round(max(2.0, (dist_km / 45.0) * 60.0), 1)

    return {
        "source": "SIMULATION_ENGINE",
        "coordinates": coords,
        "distance_km": dist_km,
        "duration_minutes": duration_min,
        "traffic_level": "MODERATE"
    }

def is_route_deviated(
    current_lat: float,
    current_lon: float,
    route_coordinates: List[List[float]],
    deviation_threshold_meters: float = 250.0
) -> Tuple[bool, float]:
    """
    Determines if vehicle has drifted more than threshold away from planned polyline.
    """
    if not route_coordinates:
        return False, 0.0

    min_dist = float("inf")
    for pt in route_coordinates:
        d = haversine_distance_meters(current_lat, current_lon, pt[0], pt[1])
        if d < min_dist:
            min_dist = d

    is_deviated = min_dist > deviation_threshold_meters
    return is_deviated, round(min_dist, 1)
