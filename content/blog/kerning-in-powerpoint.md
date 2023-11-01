---
title: "Kerning in PowerPoint"
description: Making kerning work in PowerPoint is still a process
date: Last modified
tags:
    - python
    - font engineering
draft: yes
---
Microsoft Word expects kerning data in a GPOS table. PowerPoint expects it in an old style kern table. This is how I make it work in both apps.

In Glyphs, I first prepare my font using the **Kern Flattener** script by mekkablue. It will create a copy of the current document, turn all group kerning into glyph kerning and set some other parameters. I export this new document somewhere as TTF and close the file. There’s no need to save it as it will not be needed anymore.

I then extract the `kern` table of the exported fonts as XML using **[ttx](https://github.com/fonttools/fonttools)**. Having a bunch of duplicate TTFs laying around would surely trip me up later on, so I immediately delete the fonts. The following Terminal command will do that for a couple of font files:

```plain
ttx -t kern -o SomeFont-Regular-kern.xml SomeFont-Regular.ttf
ttx -t kern -o SomeFont-Bold-kern.xml SomeFont-Bold.ttf
rm SomeFont-Regular.ttf
rm SomeFont-Bold.ttf
```

Back to the original glyphs file, I export the TTFs as usual. Then, it is time to merge the `kern` table extracted above with the final font. This is the Terminal command:

```plain
ttx -m SomeFont-Regular.ttf SomeFont-Regular-kern.xml
ttx -m SomeFont-Bold.ttf SomeFont-Bold-kern.xml
```

Alternatively, it is possible to merge a table into a font via Python script by creating an empty TTFont object, importing the XML into it and then copying the table over. This could be adapted into a loop, if necessary.

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

As PowerPoint does not support OpenType features, it can only access glyphs that have Unicode values. I have tested this with a font that has stylistic sets (unencoded glyphs) which have kerning values. The kerning of those glyphs works in Word.

This was tested to be working on:

- version 2309 of Word and PowerPoint 365
- version 16.78 of Word and PowerPoint for Mac

This post was intended for me to remember how I done it. Your mileage may vary.
