# Obsidian Tekken Notation

Render [Tekken Notation](https://tekken.fandom.com/wiki/Move_Terminology) Diagrams in [Obsidian](https://obsidian.md)

![Demonstration](https://drive.google.com/file/d/1VczBsx-NiQDJjY2i6IP4zMM8IUm9_HiO/view?usp=sharing)

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

results in:
![](https://drive.google.com/file/d/1nCLBPmVPhfChz1jJLBMtipN5ZjwWl2G7/view?usp=sharing)

- adding name:
to add a name you need to start your notation with "name",
~~~markdown
```tekken
"EWGF",f,n,d,df,2
```
~~~

results in:
![](https://drive.google.com/file/d/198kYu6br6DX9-pXz5Df5R48U2KRyKrau/view?usp=sharing)

- adding info at the end:
to add info at the end (ex: damage etc) you need to end your notation with "text",
~~~markdown
```tekken
"EWGF",f,n,d,df,2,"50 damage"
```
~~~

results in:
![](https://drive.google.com/file/d/1NMXZyTZ47frxOFw4uBzBQZ3WQw1hs6Ai/view?usp=sharing)

- adding custom text as input:
to add custom text as part of the input you need to just write it as text WITHOUT quotes,
~~~markdown
```tekken
"EWGF",f,n,d,df,2,same frame input,"50 damage"
```
~~~

results in:
![](https://drive.google.com/file/d/1OmNbJD8cqlBBt9XUps4mjVHqbx0654Ow/view?usp=sharing)

## Installation
`Settings > Community plugins > Community Plugins > Browse` and search for `Tekken Notation`.