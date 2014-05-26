#CXXFLAGS=-Wall -std=c++11 -O0 -g -D_GLIBCXX_DEBUG
CXXFLAGS=-Wall -std=c++11 -O2
LYNX3_SOURCES=Lynx3.cpp Lynx3-patterns.cpp Lynx3-opening.cpp
LYNX3_OBJECTS=Lynx3.o Lynx3-patterns.o Lynx3-opening.o

all: Lynx3

Lynx3: $(LYNX3_OBJECTS)
	$(CXX) $(CXXFLAGS) -o $@ $(LYNX3_OBJECTS)

Lynx3.js: $(LYNX3_SOURCES)
	em++ -std=c++11 -O2 -o $@ $(LYNX3_SOURCES) \
		-s TOTAL_MEMORY=67108864 -s EXPORTED_FUNCTIONS="['_play']"

clean:
	rm -f $(LYNX3_OBJECTS)

distclean: clean
	rm -f Lynx3

.PHONY: all clean distclean
