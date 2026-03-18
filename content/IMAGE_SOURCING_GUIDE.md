# KickScan.io — Image Sourcing Guide
## Player Cutouts & Trophy PNGs for Hero Section

---

## ⚠️ IMPORTANT: Copyright Notice

Using Messi/Ronaldo photos directly is a **copyright risk**. Here are your options ranked by safety:

### Option A: FREE PNG RENDER SITES (Quick & Easy)
These sites have pre-cut transparent PNGs. Quality varies.

**Messi in Argentina jersey:**
- https://sportrenders.com/leo-messi-png-argentina-football-render-2/
- https://www.citypng.com/search?q=lionel+messi+argentina
- https://freepngimg.com/sports/soccer-players (search Messi)
- https://www.pngplay.com/free-png/lionel-messi

**Ronaldo in Portugal jersey:**
- https://www.pngall.com/cristanio-ronaldo-png/
- https://freepngimg.com/sports/cristiano-ronaldo
- https://www.pngplay.com/free-png/cristiano-ronaldo
- https://toppng.com/collection/euro-2024-ronaldo

**World Cup Trophy:**
- https://www.cleanpng.com/free/fifa-world-cup-trophy.html
- https://www.vecteezy.com/free-png/world-cup-trophy
- https://www.hiclipart.com/search?clipart=FIFA+World+Cup+Trophy

### Option B: DIY with remove.bg (Best Quality)
1. Find a high-res photo on Google Images
2. Go to https://remove.bg
3. Upload → instant transparent background
4. Download PNG
5. Place in `/public/players/`

### Option C: AI-Generated (Safest for Copyright) ✅ RECOMMENDED
Use an AI image generator to create original player-like silhouettes:
- **Midjourney**: "soccer player in light blue and white striped jersey, dynamic pose, kicking ball, transparent background, full body, studio lighting --style raw"
- **Leonardo.ai** (free tier): Same prompt
- **DALL-E**: Same approach

This avoids any likeness rights issues while still looking premium.

### Option D: Illustrated/Stylized (Safest of All)
Commission or generate stylized illustrations of generic players. No likeness issues at all.

---

## 📁 File Placement

Once you have the images, place them here:

```
/tmp/kickscan/public/
├── players/
│   ├── messi.png      (transparent, ~800-1200px tall)
│   └── ronaldo.png    (transparent, ~800-1200px tall)
├── trophy.png          (transparent, ~400-600px tall)
└── wc2026-hero.jpg    (already exists — stadium bg)
```

## 📐 Recommended Dimensions

| Image | Width | Height | Format |
|-------|-------|--------|--------|
| messi.png | 600-800px | 1000-1400px | PNG (transparent) |
| ronaldo.png | 600-800px | 1000-1400px | PNG (transparent) |
| trophy.png | 300-500px | 500-800px | PNG (transparent) |

Keep file sizes under 500KB each for fast loading. Use https://tinypng.com to compress.

---

## 🎯 Quick Action Plan

1. Go to **cleanpng.com** or **citypng.com**
2. Search "Messi Argentina" → download best cutout
3. Search "Ronaldo Portugal" → download best cutout
4. Search "World Cup trophy" → download best cutout
5. Compress all 3 at **tinypng.com**
6. Drop into `/public/players/` and `/public/`
7. Refresh site → hero is complete ✅
