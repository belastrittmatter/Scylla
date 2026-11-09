import type { DirectoryUser, ResourceRoom } from "./gcal-types";

export class GCalParserHelper {
  public static parseGoogleRoom(
    email: string,
    displayName?: string,
    rawCapacity?: number,
    rawDescription?: string,
    buildingId?: string,
    floorName?: string,
  ): ResourceRoom {
    const rawName = displayName || email.split("@")[0];

    const capMatch = rawName.match(
      /[\(\[]\s*(\d+)\s*(?:seats|chỗ|p)?\s*[\)\]]/i,
    );
    let capacity = capMatch ? parseInt(capMatch[1], 10) : 10;
    if (
      typeof rawCapacity === "number" &&
      !isNaN(rawCapacity) &&
      rawCapacity > 0
    ) {
      capacity = rawCapacity;
    }

    let cleanName = rawName;
    let building = buildingId || "Main Office";
    let floor: string | undefined = floorName || undefined;

    if (rawName.includes("-")) {
      const parts = rawName.split("-").map((p) => p.trim());
      if (parts.length >= 3) {
        if (!buildingId) building = parts[0];
        if (!floorName) floor = parts[1];
        cleanName = parts
          .slice(2)
          .join(" - ")
          .replace(/[\(\[]\s*\d+.*[\)\]]/g, "")
          .trim();
      } else if (parts.length === 2) {
        if (!buildingId) building = parts[0];
        cleanName = parts[1].replace(/[\(\[]\s*\d+.*[\)\]]/g, "").trim();
      }
    } else {
      cleanName = rawName.replace(/[\(\[]\s*\d+.*[\)\]]/g, "").trim();
    }

    if (cleanName.startsWith("c_") && cleanName.length > 15) {
      cleanName = "Meeting Room";
    }

    let officeLocation = "hcm";
    const locationSearchStr =
      `${buildingId || ""} ${building} ${rawName} ${email} ${rawDescription || ""}`.toLowerCase();
    if (
      locationSearchStr.includes("-dn") ||
      locationSearchStr.includes("_dn") ||
      locationSearchStr.endsWith("dn") ||
      locationSearchStr.includes("da nang") ||
      locationSearchStr.includes("danang")
    ) {
      officeLocation = "dn";
    } else if (
      locationSearchStr.includes("-hcm") ||
      locationSearchStr.includes("_hcm") ||
      locationSearchStr.endsWith("hcm") ||
      locationSearchStr.includes("hcm") ||
      locationSearchStr.includes("saigon") ||
      locationSearchStr.includes("ho chi minh")
    ) {
      officeLocation = "hcm";
    }

    const featuresSet = new Set<string>(["video-conference"]);
    const fullFeatureStr = `${rawName} ${rawDescription || ""}`.toLowerCase();
    if (
      fullFeatureStr.includes("tv") ||
      fullFeatureStr.includes("display") ||
      fullFeatureStr.includes("screen")
    ) {
      featuresSet.add("tv");
    }
    if (fullFeatureStr.includes("projector")) {
      featuresSet.add("projector");
    }
    if (
      fullFeatureStr.includes("whiteboard") ||
      fullFeatureStr.includes("bảng")
    ) {
      featuresSet.add("whiteboard");
    }

    const desc =
      rawDescription ||
      `${building}${floor ? ` • Floor ${floor}` : ""} • ${capacity} seats`;

    return {
      id: email,
      name: cleanName || rawName,
      email,
      capacity,
      building,
      floor,
      officeLocation,
      features: Array.from(featuresSet),
      description: desc,
    };
  }

  public static parseGoogleUser(
    email: string,
    displayName?: string,
    image?: string,
    title?: string,
    department?: string,
  ): DirectoryUser {
    let cleanName = displayName?.trim();
    if (!cleanName || cleanName.toLowerCase() === email.toLowerCase()) {
      const localPart = email.split("@")[0];
      cleanName = localPart
        .split(/[._-]/)
        .filter(Boolean)
        .map(
          (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
        )
        .join(" ");
    }

    return {
      id: email,
      name: cleanName || email,
      email,
      image,
      title: title || department || "Teammate",
      department,
    };
  }
}
