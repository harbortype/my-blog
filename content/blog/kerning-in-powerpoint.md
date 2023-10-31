---
title: "Kerning in PowerPoint"
description: Making kerning work in PowerPoint is still a process
date: Last modified
draft: yes
---
Microsoft Word expects kerning data in the GPOS table. PowerPoint expects it in the old style kern table. This is how I make it work in both apps.

I use Glyphs, so I first prepare my font using the **Kern Flattener** script by mekkablue. It will open an unsaved copy of the glyphs file, which you’ll export somewhere as TTF. No need to save the glyphs file as it will not be needed anymore.

After that, extract the `kern` table of those fonts as XML using `ttx`. The following command will do that for a single font file:

```bash
ttx -t kern -o SomeFont-Regular-kern.xml SomeFont-Regular.ttf
```

Back to the original .glyphs file, export the TTFs as usual. Then, it is time to merge the `kern` table extracted above with the final font. You can do this with this Terminal command:

```bash
ttx -m SomeFont-Regular.ttf SomeFont-Regular-kern.xml
```

Alternatively, it is possible to merge a table into a font via Python script by creating an empty TTFont object, importing the XML into it and then copying the table over:

```py
from fontTools.ttLib import TTFont

ttf_file = "SomeFont-Regular.ttf"
kern_file = "SomeFont-Regular-kern.xml"

ttf_font = TTFont(ttf_file)
kern_font = TTFont()
kern_font.importXML(kern_file)
ttf_font["kern"] = kern_font["kern"]
ttf_font.save(ttf_file)
```

As PowerPoint does not support OpenType features, it can only access glyphs that have Unicode values. I have tested this with a font that has stylistic sets (unencoded glyphs) which have kerning values. The kerning of those glyphs will work elsewhere.

This was tested to be working on:

- Word and PowerPoint 365 version 2309
- Word and PowerPoint for Mac version 16.78