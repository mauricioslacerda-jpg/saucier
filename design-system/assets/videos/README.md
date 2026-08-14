<!-- companion-binaries:start -->
## 📎 Anexos clicáveis

### 🎥 Vídeo

- [Abrir `pesto-loop.mp4`](pesto-loop.mp4)

### 🖼️ Imagens

- [Abrir `pesto-loop-poster.jpg`](pesto-loop-poster.jpg)

<!-- companion-binaries:end -->

# Vídeos em loop — como extrair do acervo bruto

Processo usado para gerar `pesto-loop.mp4` / `pesto-loop.webm` (hero da `/curso`),
reaproveitável para qualquer outro molho/receita do acervo em vídeo.

## 1. Onde está o material bruto

`G:\Meu Drive\Saucier\Curso Molhos Artesanais\Módulo X ...\` — os vídeos de cada
aula ficam em subpastas por módulo, numerados (`#110 Pesto video 1.mp4`, etc.).
São takes brutos em 4K (3840×2160) ou 1080p, câmera fixa, minutos de duração —
não são cortes prontos.

Buscar por palavra-chave:
```
find "/g/Meu Drive/Saucier" -iname "*<termo>*" \( -iname "*.mp4" -o -iname "*.mov" \)
```

## 2. Escolher o clipe certo sem assistir tudo

Cada take bruto tem 1-5 min — não dá pra assistir um por um. Gera-se um grid de
thumbnails (contact sheet) pra inspecionar visualmente em segundos:

```bash
ffmpeg -y -i "video.mp4" -vf "fps=1,scale=320:-1,tile=6x4" grid.jpg
```

Ajustar `fps` (frames por segundo capturados) e `tile` (colunas x linhas) conforme
a duração do vídeo — quanto mais longo, menor o `fps` pra caber num grid só.
Depois ler o `grid.jpg` com a ferramenta Read (é uma imagem) pra escolher o
melhor trecho visualmente — procurar por: mãos em ação, ingrediente reconhecível
em close, sem rosto/fala direta pra câmera (isso é conteúdo institucional, não
loop de fundo).

Se o trecho candidato for longo, gerar um segundo grid mais fino só daquela
faixa (`fps=2`) pra escolher o ponto de corte exato.

## 3. Extrair o loop

```bash
ffmpeg -y -ss <inicio> -t <duração+0.5> -i "video.mp4" \
  -filter_complex "[0:v]scale=960:-2,fps=25,split[a][b];\
    [a]trim=0:<duração>,setpts=PTS-STARTPTS[main];\
    [b]trim=<duração>:<duração+0.5>,setpts=PTS-STARTPTS[tail];\
    [main][tail]xfade=transition=fade:duration=0.5:offset=<duração-0.5>,format=yuv420p[out]" \
  -map "[out]" -an -c:v libx264 -crf 26 -preset slow -movflags +faststart \
  pesto-loop.mp4
```

Notas:
- `-an` remove áudio (vídeo de fundo não precisa e evita autoplay bloqueado
  por navegador — autoplay com som é bloqueado por padrão, autoplay mudo não).
- O `xfade` de 0.5s no final costura o último quadro no primeiro pra suavizar
  o corte do loop (senão dá um "pulo" visível a cada repetição).
- `scale=960:-2` — 960px de largura é suficiente pra um card de hero; não vale
  publicar em 4K (arquivo 10x maior sem ganho visual perceptível no tamanho
  exibido).
- `crf 26` equilibra qualidade/tamanho pra vídeo de fundo (não é o produto
  principal da página — não precisa de nitidez de estúdio).

## 4. Gerar o WebM (fallback mais leve)

```bash
ffmpeg -y -i pesto-loop.mp4 -c:v libvpx-vp9 -b:v 0 -crf 34 -an -row-mt 1 pesto-loop.webm
```

VP9/WebM costuma sair menor que H.264 pra mesma qualidade percebida — usar como
primeira `<source>` no HTML (o navegador pega o primeiro formato que suporta).

## 5. Poster (frame estático antes do vídeo carregar)

```bash
ffmpeg -y -i pesto-loop.mp4 -vf "select=eq(n\,0)" -vframes 1 -q:v 3 pesto-loop-poster.jpg
```

## 6. HTML — o padrão usado no hero da `/curso`

```html
<video autoplay muted loop playsinline preload="metadata"
       poster="../design-system/assets/videos/pesto-loop-poster.jpg"
       aria-label="descrição do que aparece no vídeo">
  <source src="../design-system/assets/videos/pesto-loop.webm" type="video/webm">
  <source src="../design-system/assets/videos/pesto-loop.mp4" type="video/mp4">
</video>
```

`autoplay muted loop playsinline` é o quarteto obrigatório pra autoplay
funcionar em todo navegador (inclusive mobile Safari) sem interação do
usuário. `preload="metadata"` evita baixar o vídeo inteiro antes de precisar.

## ⚠️ Gotcha: `publicar.ps1` trava com vídeo novo no vault

O `robocopy` de `design-system/assets` dentro de `publicar.ps1` tentou ler os
`.mp4`/`.webm` recém-criados no vault (`G:\...`, Google Drive Desktop) e travou
indefinidamente — provável causa: o arquivo acabado de escrever ainda não tinha
"assentado" no Google Drive (sync/placeholder), e a leitura ficou esperando.

**Workaround usado**: copiar os vídeos manualmente pro repo de deploy
(`C:\Users\mauri\saucier-site\design-system\assets\videos\`) e publicar aquele
commit específico direto via `git add/commit/push` no Bash, sem passar pelo
`publicar.ps1`. Depois disso, o `robocopy` volta a funcionar normal (os
arquivos já existem idênticos nos dois lados, então ele só compara e pula).

**Recomendação pra próxima vez que adicionar vídeo**: depois de gerar o
arquivo final na vault, copiar direto pro repo de deploy também (não confiar
só no robocopy do próximo `publicar.ps1`) — evita esperar o Drive sincronizar
um binário de alguns MB antes de conseguir publicar.

## Arquivo atual

- **Fonte**: `Curso Molhos Artesanais/Módulo 5 Molhos Verdes/5.2 - Molho Pesto/#112 pesto video 2.mp4`
  (trecho 6s–14.5s, 24s originais, 1920×1080)
- **Uso**: hero da `/curso`, card estilo polaroid ao lado do texto
- **Tamanho final**: mp4 ~2,2MB · webm ~2,6MB
