import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

const COLORS = {
  politica: "#c81e1e",
  crime: "#c81e1e",
  justica: "#c81e1e",
  corrupcao: "#c81e1e",
  economia: "#e85d00",
  financas: "#e85d00",
  mercado: "#e85d00",
  sociedade: "#ffc800",
  cultura: "#ffc800",
  saude: "#ffc800",
  educacao: "#ffc800",
};

function tagColor(tema) {
  return COLORS[tema?.toLowerCase()] || "#ffc800";
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag") || "";
  const tema = searchParams.get("tema") || "sociedade";
  const resumo = searchParams.get("resumo") || "";
  const imageUrl = searchParams.get("img") || "";

  const color = tagColor(tema);
  const textColor = color === "#ffc800" ? "#000000" : "#ffffff";
  const LOGO = "https://raw.githubusercontent.com/oterrasan/ovalorcapital/main/public/assets/vc-logo.png";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1350,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          position: "relative",
          fontFamily: "sans-serif",
          background: "#08080f",
        }}
      >
        {/* Imagem de fundo */}
        {imageUrl && (
          <img
            src={imageUrl}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 1080,
              height: 1350,
              objectFit: "cover",
            }}
          />
        )}

        {/* Overlay escuro */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1080,
            height: 1350,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.85) 100%)",
            display: "flex",
          }}
        />

        {/* Logo topo */}
        <div style={{ position: "absolute", top: 60, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img src={LOGO} style={{ width: 160, height: "auto" }} />
        </div>

        {/* Tag colorida */}
        <div
          style={{
            position: "absolute",
            top: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: color,
            paddingLeft: 40,
            paddingRight: 40,
            paddingTop: 20,
            paddingBottom: 20,
            borderRadius: 6,
          }}
        >
          <span style={{ color: textColor, fontWeight: 800, fontSize: 52, letterSpacing: 2 }}>
            {tag.toUpperCase()}
          </span>
        </div>

        {/* Resumo */}
        <div
          style={{
            position: "absolute",
            top: 640,
            left: 50,
            right: 50,
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "#ffffff", fontWeight: 800, fontSize: 64, lineHeight: 1.2, textAlign: "left" }}>
            {resumo.toUpperCase()}
          </span>
        </div>

        {/* Rodapé */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <img src={LOGO} style={{ width: 80, height: "auto" }} />
          <span style={{ color: "#ffffff", fontWeight: 700, fontSize: 28, letterSpacing: 2 }}>O VALOR CAPITAL</span>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 22 }}>Siga @ovalorcapital</span>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 20 }}>Liberdade econômica, família & patrimônio</span>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 18 }}>www.ovalorcapital.com.br</span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1350,
    }
  );
}
