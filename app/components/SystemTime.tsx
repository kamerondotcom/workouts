"use client";

import { useEffect, useState } from "react";

export default function SystemTime() {
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    const update = () => setNow(new Date().toLocaleString());
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return <>{now || ""}</>;
}
