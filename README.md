# Obsidian Tekken Notation

Render [Tekken Notation](https://tekken.fandom.com/wiki/Move_Terminology) Diagrams in [Obsidian](https://obsidian.md)

![Demonstration](https://i.imgur.com/hCePE7w.gif)

## Usage
Create a fenced codeblock using `tekken` as the language.
Specify your notations inside.

List of inputs is in the [Wiki](https://github.com/OpTi9/obsidian-tekken-notation/wiki)

### Examples

- default inputs:
~~~markdown
```tekken
f,n,d,df,2
```
~~~

![](https://i.imgur.com/OKTceN5.png)

- adding name:
to add a name you need to start your notation with "name",
~~~markdown
```tekken
"EWGF",f,n,d,df,2
```
~~~

![](https://i.imgur.com/gD8dCph.png)

- adding info at the end:
to add info at the end (ex: damage etc) you need to end your notation with "text",
~~~markdown
```tekken
"EWGF",f,n,d,df,2,"50 damage"
```
~~~

![](https://i.imgur.com/eA2l7dh.png)

- adding custom text as input:
to add custom text as part of the input you need to just write it as text WITHOUT quotes,
~~~markdown
```tekken
"EWGF",f,n,d,df,2,same frame input,"50 damage"
```
~~~

![](https://i.imgur.com/mgxpkY3.png)

## Installation
`Settings > Community plugins > Community Plugins > Browse` and search for `Tekken Notation`.