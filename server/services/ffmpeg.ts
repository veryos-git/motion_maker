// license Jonas Immanuel Frey GPLubuntuuser@ubuntuuser-MS-7C52
import { join } from "node:path";

export interface Adjustments {
  brightness: number;
  contrast: number;
  shadows: number;
  highlights: number;
}

export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function checkFfmpeg(): Promise<boolean> {
  try {
    const cmd = new Deno.Command("ffmpeg", {
      args: ["-version"],
      stdout: "null",
      stderr: "null",
    });
    const { code } = await cmd.output();
    return code === 0;
  } catch {
    return false;
  }
}

function buildFilterChain(
  adjustments: Adjustments,
  crop: CropRegion | null,
  outputWidth?: number,
  outputHeight?: number,
): string {
  const filters: string[] = [];

  if (crop && crop.width > 0 && crop.height > 0) {
    filters.push(`crop=${crop.width}:${crop.height}:${crop.x}:${crop.y}`);
  }

  const b = adjustments.brightness;
  const c = adjustments.contrast;
  const s = adjustments.shadows;
  const h = adjustments.highlights;
  const gamma = (1.0 + s * 0.6).toFixed(2);
  const saturation = (1.0 + h * 0.6).toFixed(2);

  if (b !== 0 || Math.abs(c - 1) > 0.001 || s !== 0 || h !== 0) {
    filters.push(
      `eq=brightness=${b}:contrast=${c}:gamma=${gamma}:saturation=${saturation}`,
    );
  }

  if (outputWidth && outputHeight) {
    filters.push(`scale=${outputWidth}:${outputHeight}`);
  }

  return filters.join(",");
}

export async function generatePreview(
  projectDir: string,
  frameNames: string[],
  fps: number,
  adjustments: Adjustments,
  crop: CropRegion | null,
): Promise<string> {
  const outPath = join(projectDir, "preview.mp4");
  const concatPath = join(projectDir, "concat.txt");

  const dur = 1 / fps;
  const lines = frameNames.map((name) =>
    `file 'frames/${name}'\nduration ${dur}`
  );
  await Deno.writeTextFile(concatPath, lines.join("\n") + "\n");

  const vf = buildFilterChain(adjustments, crop);

  const args = [
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", concatPath,
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-preset", "fast",
  ];
  if (vf) args.push("-vf", vf);
  args.push(outPath);

  const cmd = new Deno.Command("ffmpeg", { args });
  const { code, stderr } = await cmd.output();
  if (code !== 0) {
    const errText = new TextDecoder().decode(stderr);
    throw new Error(`Preview generation failed: ${errText}`);
  }

  return outPath;
}

export async function exportGif(
  projectDir: string,
  frameNames: string[],
  fps: number,
  adjustments: Adjustments,
  crop: CropRegion | null,
  gifWidth: number,
  gifHeight: number,
  quality: number,
): Promise<string> {
  const outPath = join(projectDir, "export.gif");
  const concatPath = join(projectDir, "concat.txt");
  const palettePath = join(projectDir, "palette.png");

  const dur = 1 / fps;
  const lines = frameNames.map((name) =>
    `file 'frames/${name}'\nduration ${dur}`
  );
  await Deno.writeTextFile(concatPath, lines.join("\n") + "\n");

  const preFilters = buildFilterChain(adjustments, crop);
  const fpsFilter = `fps=${fps}`;
  const scaleFilter = `scale=${gifWidth}:${gifHeight}:flags=lanczos`;

  const fullPre = [preFilters, fpsFilter, scaleFilter].filter(Boolean).join(
    ",",
  );

  const paletteArgs = [
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", concatPath,
    "-vf", `${fullPre},palettegen=max_colors=256:stats_mode=diff`,
    palettePath,
  ];

  let cmd = new Deno.Command("ffmpeg", { args: paletteArgs });
  let { code, stderr } = await cmd.output();
  if (code !== 0) {
    throw new Error(
      `GIF palette generation failed: ${new TextDecoder().decode(stderr)}`,
    );
  }

  const gifArgs = [
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", concatPath,
    "-i", palettePath,
    "-lavfi",
    `${fullPre}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5`,
    outPath,
  ];

  cmd = new Deno.Command("ffmpeg", { args: gifArgs });
  ({ code, stderr } = await cmd.output());
  if (code !== 0) {
    throw new Error(
      `GIF export failed: ${new TextDecoder().decode(stderr)}`,
    );
  }

  return outPath;
}
