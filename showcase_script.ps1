Add-Type -AssemblyName System.Drawing

$outputDir = "C:\Users\saite\.gemini\antigravity\scratch\LifePartner-AI\play_store_assets"
if (!(Test-Path $outputDir)) { New-Item -ItemType Directory -Force -Path $outputDir }

$slides = @(
    @{
        File = "indus_screenshot_1.jpg"
        OutName = "showcase_1_ai_matchmaking.png"
        Tag = "AI COMPATIBILITY MATCHES"
        Title = "Find Your True Life Partner"
        Subtitle = "Smart AI matching based on core values & personality"
        TagColor = [System.Drawing.Color]::FromArgb(244, 63, 94) # Rose
    },
    @{
        File = "indus_screenshot_8.jpg"
        OutName = "showcase_2_kundli_astrology.png"
        Tag = "VEDIC ASTROLOGY & KUNDLI"
        Title = "36 Guna Horoscope Harmony"
        Subtitle = "Detailed astrological alignment, Rashi & planetary match"
        TagColor = [System.Drawing.Color]::FromArgb(168, 85, 247) # Purple
    },
    @{
        File = "indus_screenshot_7.jpg"
        OutName = "showcase_3_private_video_calls.png"
        Tag = "100% PRIVATE & ENCRYPTED"
        Title = "Crystal-Clear HD Video Calls"
        Subtitle = "Connect face-to-face safely without sharing phone numbers"
        TagColor = [System.Drawing.Color]::FromArgb(14, 165, 233) # Sky blue
    },
    @{
        File = "indus_screenshot_meetups.jpg"
        OutName = "showcase_4_singles_meetups.png"
        Tag = "REAL-WORLD COMMUNITY"
        Title = "Curated Singles Meetups"
        Subtitle = "Join verified coffee speed dates & exclusive lounge mixers"
        TagColor = [System.Drawing.Color]::FromArgb(245, 158, 11) # Amber
    },
    @{
        File = "indus_screenshot_6.jpg"
        OutName = "showcase_5_interactive_map.png"
        Tag = "NEARBY & GLOBAL DISCOVERY"
        Title = "Discover Singles on the Map"
        Subtitle = "Explore verified matches in your city and worldwide"
        TagColor = [System.Drawing.Color]::FromArgb(16, 185, 129) # Emerald
    },
    @{
        File = "indus_screenshot_guru.jpg"
        OutName = "showcase_6_ai_guru_coach.png"
        Tag = "PERSONAL DATING ADVISOR"
        Title = "AI Guru Relationship Coach"
        Subtitle = "Get personalized profile tips & custom icebreakers"
        TagColor = [System.Drawing.Color]::FromArgb(99, 102, 241) # Indigo
    },
    @{
        File = "indus_screenshot_3.jpg"
        OutName = "showcase_7_ai_bio_generator.png"
        Tag = "SMART PROFILE BUILDER"
        Title = "1-Tap AI Bio Generator"
        Subtitle = "Craft an authentic, engaging profile in seconds"
        TagColor = [System.Drawing.Color]::FromArgb(236, 72, 153) # Pink
    },
    @{
        File = "indus_screenshot_5.jpg"
        OutName = "showcase_8_instant_snaps.png"
        Tag = "DAILY MOMENTS & STORIES"
        Title = "24h Instant Snaps & Stories"
        Subtitle = "Share authentic lifestyle photos with verified matches"
        TagColor = [System.Drawing.Color]::FromArgb(20, 184, 166) # Teal
    }
)

$targetW = 1080
$targetH = 1920

$fontFamily = New-Object System.Drawing.FontFamily("Arial")
$tagFont = New-Object System.Drawing.Font($fontFamily, 18, [System.Drawing.FontStyle]::Bold)
$titleFont = New-Object System.Drawing.Font($fontFamily, 44, [System.Drawing.FontStyle]::Bold)
$subFont = New-Object System.Drawing.Font($fontFamily, 22, [System.Drawing.FontStyle]::Regular)

foreach ($slide in $slides) {
    $bmp = New-Object System.Drawing.Bitmap($targetW, $targetH)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # 1. Background Luxury Gradient
    $bgRect = New-Object System.Drawing.Rectangle(0, 0, $targetW, $targetH)
    $cTop = [System.Drawing.Color]::FromArgb(15, 23, 42)      # Deep Midnight Slate
    $cBottom = [System.Drawing.Color]::FromArgb(30, 27, 75)   # Rich Indigo-950
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($bgRect, $cTop, $cBottom, [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
    $g.FillRectangle($bgBrush, $bgRect)
    $bgBrush.Dispose()

    # 2. Glowing Ambient Flare behind phone
    $flareBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(45, $slide.TagColor.R, $slide.TagColor.G, $slide.TagColor.B))
    $g.FillEllipse($flareBrush, 140, 450, 800, 800)
    $flareBrush.Dispose()

    # 3. Top Tag Pill Badge
    $tagSize = $g.MeasureString("✦  " + $slide.Tag, $tagFont)
    $pillW = [int]($tagSize.Width + 40)
    $pillH = 46
    $pillX = [int](($targetW - $pillW) / 2)
    $pillY = 70

    $pillBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, $slide.TagColor.R, $slide.TagColor.G, $slide.TagColor.B))
    $pillBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, $slide.TagColor.R, $slide.TagColor.G, $slide.TagColor.B), 2)
    $pillRect = New-Object System.Drawing.Rectangle($pillX, $pillY, $pillW, $pillH)
    $g.FillRectangle($pillBg, $pillRect)
    $g.DrawRectangle($pillBorder, $pillRect)
    $pillBg.Dispose()
    $pillBorder.Dispose()

    $tagTextBrush = New-Object System.Drawing.SolidBrush($slide.TagColor)
    $g.DrawString("✦  " + $slide.Tag, $tagFont, $tagTextBrush, $pillX + 20, $pillY + 11)
    $tagTextBrush.Dispose()

    # 4. Main Title
    $titleSize = $g.MeasureString($slide.Title, $titleFont)
    $titleX = [int](($targetW - $titleSize.Width) / 2)
    $titleY = 140
    $titleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.DrawString($slide.Title, $titleFont, $titleBrush, $titleX, $titleY)
    $titleBrush.Dispose()

    # 5. Subtitle
    $subSize = $g.MeasureString($slide.Subtitle, $subFont)
    $subX = [int](($targetW - $subSize.Width) / 2)
    $subY = 215
    $subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(203, 213, 225)) # Slate 300
    $g.DrawString($slide.Subtitle, $subFont, $subBrush, $subX, $subY)
    $subBrush.Dispose()

    # 6. Phone Mockup Display
    $phoneSourcePath = "C:\Users\saite\.gemini\antigravity\scratch\LifePartner-AI\apps\web\public\" + $slide.File
    if (Test-Path $phoneSourcePath) {
        $sourceImg = [System.Drawing.Image]::FromFile($phoneSourcePath)
        
        $phoneW = 860
        $phoneH = 1540
        $phoneX = [int](($targetW - $phoneW) / 2)
        $phoneY = 320

        # Phone outer shadow
        $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100, 0, 0, 0))
        $g.FillRectangle($shadowBrush, $phoneX - 12, $phoneY - 10, $phoneW + 24, $phoneH + 20)
        $shadowBrush.Dispose()

        # Phone Bezel Frame (Sleek Dark Titanium Bezel)
        $bezelPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(75, 85, 99), 8)
        $g.DrawRectangle($bezelPen, $phoneX - 4, $phoneY - 4, $phoneW + 8, $phoneH + 8)
        $bezelPen.Dispose()

        # Draw Inner Screenshot
        $g.DrawImage($sourceImg, $phoneX, $phoneY, $phoneW, $phoneH)
        $sourceImg.Dispose()
    }

    # Save final showcase screenshot
    $destPath = Join-Path $outputDir $slide.OutName
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created: $($slide.OutName)"
}

$titleFont.Dispose()
$subFont.Dispose()
$tagFont.Dispose()
$fontFamily.Dispose()

Write-Host "ALL 8 SHOWCASE SCREENSHOTS GENERATED SUCCESSFULLY!"
