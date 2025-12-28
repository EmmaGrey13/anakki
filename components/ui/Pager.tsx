import type { ReactNode } from "react";
import { Platform } from "react-native";

type PagerProps = {
  children: ReactNode[];
  style?: any;
};

let PagerView: any = null;

if (Platform.OS !== "web") {
  PagerView = require("react-native-pager-view").default;
}

export function Pager({ children, style }: PagerProps) {
  if (Platform.OS === "web") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          width: "100%",
        }}
      >
        {children.map((child, index) => (
          <div
            key={index}
            style={{
              width: "100%",
              flexShrink: 0,
              scrollSnapAlign: "start",
            }}
          >
            {child}
          </div>
        ))}
      </div>
    );
  }

  return <PagerView style={style}>{children}</PagerView>;
}