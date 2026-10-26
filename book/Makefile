# SPDX-License-Identifier: GPL-3.0-or-later
# Makefile for building the Aetherium Companion eBook (Aetherium_Book.pdf)

PDF = Aetherium_Book.pdf
TEX = Aetherium_Book.tex

.PHONY: all clean

all: $(PDF)

$(PDF): $(TEX) cover_logo.png app_icon.png
	pdflatex -interaction=nonstopmode $(TEX)
	pdflatex -interaction=nonstopmode $(TEX)
	cp $(PDF) ../$(PDF)

clean:
	rm -f *.aux *.log *.out *.toc
