---
title: "Kerning in PowerPoint"
description: Making kerning work in PowerPoint is still a process
date: Last modified
tags:
    - font engineering
    - python
---
Microsoft Word expects kerning data in a GPOS table. PowerPoint expects it in an old style kern table. This is how I make it work in both apps.

In Glyphs, I first prepare my font using the *Kern Flattener* script by <a href="https://github.com/mekkablue/Glyphs-Scripts">mekkablue</a>. It will open a copy of the current document, turn all group kerning into glyph kerning and set some other parameters. I export this new document somewhere as TTF and close the file. There’s no need to save it as it will not be needed anymore.

I then extract the `kern` table of the exported fonts as XML using **[ttx](https://github.com/fonttools/fonttools)**. The following Terminal command will do that for a couple of font files:

```plain
ttx -t kern -o SomeFont-Regular-kern.xml SomeFont-Regular.ttf
ttx -t kern -o SomeFont-Bold-kern.xml SomeFont-Bold.ttf
```

I don’t like having a bunch of duplicate TTFs laying around to trip me up, so I immediately delete the fonts.

Back to the original glyphs file, I export the TTFs as usual. Then, it is time to merge the `kern` table extracted above with the final fonts. This is the Terminal command:

```plain
ttx -m SomeFont-Regular.ttf SomeFont-Regular-kern.xml
ttx -m SomeFont-Bold.ttf SomeFont-Bold-kern.xml
```

Alternatively, it is possible to merge a table into a font via Python script by creating an empty TTFont object, importing the XML into it and then copying the table over. Something like this:

```plain
from fontTools.ttLib import TTFont

ttf_file = "SomeFont-Regular.ttf"
kern_file = "SomeFont-Regular-kern.xml"

ttf_font = TTFont(ttf_file)
kern_font = TTFont()
kern_font.importXML(kern_file)
ttf_font["kern"] = kern_font["kern"]
ttf_font.save(ttf_file)
```

{% figure "content/img/kerning-in-powerpoint.png", "Screenshot of a PowerPoint for Mac window. The slide being editted contains a text box with the word “Type”, which demonstrates that kerning is working because the “y” is slightly tucked under the right side of the “T” horizontal stroke.", "", "screenshot", [960, 1920] %}

I have tested this with a font that has stylistic sets (unencoded glyphs) which have kerning values. Surprisingly, the kerning of those glyphs works in Word and does not affect the kerning in PowerPoint. This was tested to be working on:

- version 2309 of Word and PowerPoint 365
- version 16.78 of Word and PowerPoint for Mac
