#include <algorithm>
#include <iostream>
#include <map>
#include <memory>
#include <sstream>
#include <string>
#include <vector>

// Simulation heuristics parameters
const int EDGE_BIAS_THRESHOLD = 50;	// Avoid playing at the edge for this number of simulation steps

// Tree search parameters
const int SAMPLES = 32;				// Number of samples at tree nodes, has a huge effect on performance
const double ALPHA = 0.75;			// Blending parameter for AMAF samples and actual samples in the computation of the score of a node

// Timing parameters
const double TOTAL_TIME = 20.0;		// Maximum amount of time that may be used for a game (actual time may be higher)
const int TIME_DIVIDER = 10;			// The remaining time is divided by this number to determine the time for the current move
const double MINIMUM_TIME = 0.1;		// The minimum amount of time used for a move

const int POSITIONS = 106;			// Total number of positions on the board

// Masks for the 'edges' array
const int TOP_LEFT_EDGE = 1;			
const int BOT_LEFT_EDGE = 2;
const int BOT_EDGE = 4;
const int BOT_RIGHT_EDGE = 8;
const int TOP_RIGHT_EDGE = 16;

// Masks for the 'corners' array
const int TOP_CORNER = 1;
const int TOP_LEFT_CORNER = 2;
const int BOT_LEFT_CORNER = 4;
const int BOT_RIGHT_CORNER = 8;
const int TOP_RIGHT_CORNER = 16;

// Determines whether we win with a given set of captured corners
	// Given a set of captured corners encoded as the bitmask i, win[i] is true if this set of captured corners is winning, otherwise win[i] is false
const bool win[] = {0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,1,0,0,0,1,0,1,1,1,0,1,1,1,1,1,1,1};

// Corner masks for a given edge mask, determines which corners we captured given a set of edges
	// Given a set of edges encoded as a bitmask i, cornerSet[i] gives the corners captured by a component that connects these edges
const int cornerSet[107] = {0,0,0,0,0,0,0,6,0,0,0,2,0,8,12,14,0,0,0,3,0,1,4,7,0,17,16,19,24,25,28,31};

// A list of board positions that are on the edge of the playing board
	// We only use this to find connections between edges in the 'winner' method, as we dont need to check from every edge, this array only contains the moves from three edges
const int edge[107] = {1,4,9,16,25,36,49,2,5,10,17,26,37,61,72,82,91,99,106};

// The neighbour positions of each positions in either clockwise or counter-clockwise order 
const int neighbours[107][8] = {{},{4,3,2},{5,6,3,1},{1,2,6,7,8,4},{9,8,3,1},{10,11,6,2},{2,3,7,12,11,5},{3,6,12,13,14,8},{3,4,9,15,14,7},{4,8,15,16},{5,11,18,17},{19,18,10,5,6,12},{19,20,13,7,6,11},{21,20,12,7,14,22},{23,22,13,7,8,15},
{16,24,23,14,8,9},{9,15,24,25},{26,27,18,10},{17,27,28,19,11,10},{18,11,12,20,29,28},{19,29,30,21,13,12},{32,22,13,20,30,31},{32,33,23,14,13,21},{34,33,22,14,15,24},{34,35,25,16,15,23},{36,35,24,16},{37,38,27,17},{17,18,28,39,38,26},{19,18,27,39,40,29},
{19,20,30,41,40,28},{21,20,29,41,42,31},{32,21,30,42,43,44},{33,22,21,31,44,45},{34,23,22,32,45,46},{35,24,23,33,46,47},{34,24,25,36,48,47},{25,35,48,49},{26,38,50},{51,50,37,26,27,39},{51,38,27,28,40,52},{39,52,53,41,29,28},{54,53,40,29,30,42},
{55,54,41,30,31,43},{55,42,31,44,56},{32,31,43,56,57,45},{32,33,46,58,57,44},{34,33,45,58,59,47},{34,35,48,60,59,46},{35,36,49,61,60,47},{61,48,36},{62,51,38,37},{50,38,39,52,63,62},{51,39,40,53,64,63},{64,65,54,41,40,52},
{55,66,65,53,41,42},{54,66,67,56,43,42},{68,67,55,43,44,57},{68,69,58,45,44,56},{69,70,59,46,45,57},{70,71,60,47,46,58},{71,59,47,48,61,72},{72,60,48,49},{73,63,51,50},{51,52,64,74,73,62},{65,53,52,63,74,75},{64,53,54,66,76,75},{55,54,65,76,77,67},
{68,78,77,66,55,56},{69,57,56,67,78,79},{68,57,58,70,80,79},{69,80,81,71,59,58},{70,81,82,72,60,59},{61,60,71,82},{62,63,74,83},{84,83,73,63,64,75},{85,84,74,64,65,76},{85,86,77,66,65,75},{87,86,76,66,67,78},{68,67,77,87,88,79},{68,69,80,89,88,78},
{69,70,81,90,89,79},{70,71,82,91,90,80},{91,81,71,72},{73,74,84,92},{85,93,92,83,74,75},{84,93,94,86,76,75},{85,76,77,87,95,94},{86,77,78,88,96,95},{87,96,97,89,79,78},{98,97,88,79,80,90},{98,99,91,81,80,89},{82,81,90,99},{83,84,93,100},
{85,84,92,100,101,94},{85,86,95,102,101,93},{102,103,96,87,86,94},{103,95,87,88,97,104},{98,89,88,96,104,105},{99,106,105,97,89,90},{91,90,98,106},{92,93,101},{100,93,94,102},{101,94,95,103},{104,96,95,102},{105,97,96,103},{104,97,98,106},{105,98,99}};

// The edge mask of the edges a position is connected to
	// edges[i] is an edge mask that encodes the set of a edges to which position i is adjacent
const int edges[107] = {0,17,1,0,16,1,0,0,0,16,1,0,0,0,0,0,16,1,0,0,0,0,0,0,0,16,1,0,0,0,0,0,0,0,0,0,16,3,0,0,0,0,0,0,0,0,0,0,0,24,2,0,0,0,0,0,0,0,0,0,0,8,2,0,0,0,0,0,0,0,0,0,8,2,0,0,0,0,0,0,0,0,8,2,0,0,0,0,0,0,0,8,2,0,0,0,0,0,0,8,6,4,4,4,4,4,12};

// The distance of a position from the edge
	// edgeDistance[i] is the smallest number of positions between position i and the edge
const int edgeDistance[107] = {0,0,0,1,0,0,1,2,1,0,0,1,2,3,2,1,0,0,1,2,3,4,3,2,1,0,0,1,2,3,4,5,4,3,2,1,0,0,1,2,3,4,5,6,5,4,3,2,1,0,0,1,2,3,4,5,5,4,3,2,1,0,0,1,2,3,4,4,4,3,2,1,0,0,1,2,3,3,3,3,2,1,0,0,1,2,2,2,2,2,1,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0};

// Patterns for the monte carlo simulation
// See Lynx3-patterns.cpp
extern const std::vector<unsigned long long> patterns[107];	// defined in Lynx3-patterns.cpp

// This opening book is computed by evaluating the strength of a game state by playing a number of games in self-play
// Each position has been sampled using 256 games with a time limit of 5 seconds per player.
// The best move in a given state is picked using the minimax algorithm, where the first player tried to maximize his win chance, and the opponent tries to minimize the win chance of the first player
std::map<std::vector<int>, int> getOpeningBook();  // defined in Lynx3-opening.cpp
const auto openingBook = getOpeningBook();

static long long nanoTime()
{
	return clock()*(1000000000LL/CLOCKS_PER_SEC);
}

// A random number generator.
// Derived from Random.java, removed synchronization and other checks to improve performance
class Rng
{
	unsigned long long seed;

public:
	Rng(unsigned long long s) : seed(s) { }

	unsigned randomInt() {
		seed = seed * 0x5deece66dULL + 0xbULL;
		return (seed >> 16);
	}

	int randomInt(int n)
	{
		// Not completely correct, as results are a little biased, but good enough for our purpose
		// We shift by 16 because the higher bits provide higher quality randomness
		return (randomInt() >> 16) % n;
	}
};

// The result of a set of AMAF playouts (as constructed by)
struct AmafPlayout
{
	int samples;		// The number of samples performed
	int wins;			// The number of times we won

	int mySamples[POSITIONS + 1];	// mySamples[i] is the number of samples where move i was played by me 
	int myWins[POSITIONS + 1];		// myWins[i] is the number of samples where move i was played by me and I won
	int opSamples[POSITIONS + 1];	// opSamples[i] is the number of samples where move i was played by the opponent 
	int opWins[POSITIONS + 1];		// opWins[i] is the number of samples where move i was played by the opponent and I won
};

// This class encodes a game state
struct GameState
{
	// The moves that can still be played in this state, up to index 'end' defined below
	unsigned char remainingMoves[POSITIONS];
	
	// The position of a given move in the remainingMoves array, i.e. positions[i] is the position of move i in the remainingMoves array
	// This array is used to allow O(1) removal of moves from the remainingMoves array 
	unsigned char positions[POSITIONS + 1];
	
	// Moves in remainingMoves starting from index end have already been played 
	int end;

	// Bit sets encoding the board state
	unsigned long long myMovesLeft, myMovesRight;	// Moves played by me
	unsigned long long opMovesLeft, opMovesRight; // Moves played by the opponent

public:
	// Constructs the initial game state
	GameState()
	{
		for(int i = 0; i < POSITIONS; i++) {
			remainingMoves[i] = (i + 1);
			positions[i + 1] = i;
		}
		end = POSITIONS;
		myMovesLeft = myMovesRight = 0;
		opMovesLeft = opMovesRight = 0;
	}

	// Copy constructor
	GameState(const GameState &other)
	{
		std::copy(other.remainingMoves, other.remainingMoves + other.end, remainingMoves);
		std::copy(other.positions + 1, other.positions + POSITIONS + 1, positions + 1);
		end = other.end;
		myMovesLeft = other.myMovesLeft;
		myMovesRight = other.myMovesRight;
		opMovesLeft = other.opMovesLeft;
		opMovesRight = other.opMovesRight;
	}

	// Swaps the moves done by the players
	void swapPlayers()
	{
		unsigned long long mML = myMovesLeft;
		unsigned long long mMR = myMovesRight;
		myMovesLeft = opMovesLeft;
		myMovesRight = opMovesRight;
		opMovesLeft = mML;
		opMovesRight = mMR;
	}

	// Sets the move at the given index as unavailable for playing
	// Swaps the move at the given index in remainingMoves with the move at remainingMoves[end - 1] and reduces end by one
	void swapOut(int index)
	{
		end--;
		swapMoveIndices(index, end);
	}

	// Sets a given move as unavailable for playing
	void remove(int move)
	{
		swapOut(positions[move]);
	}

	// Swaps two entries in the remainingMoves array
	void swapMoveIndices(int i, int j)
	{
		unsigned char temp = remainingMoves[i];
		remainingMoves[i] = remainingMoves[j];
		remainingMoves[j] = temp;

		// Update the positions of the entries
		positions[remainingMoves[i]] = i;
		positions[remainingMoves[j]] = j;
	}
	
	// Updates the state with my move
	void updateMyMove(int move)
	{
		remove(move);
		if (move < 64) {
			myMovesLeft |= 1ULL << move;
		} else {
			myMovesRight |= 1ULL << (move - 64);
		}
	}
	
	// Updates the state with an opponent move
	void updateOpMove(int move)
	{
		remove(move);
		if (move < 64) {
			opMovesLeft |= 1ULL << move;
		} else {
			opMovesRight |= 1ULL << (move - 64);
		}
	}
	
	// Monte carlo sampling with the all-moves-as-first (AMAF) heuristic
	AmafPlayout sample(const bool myMoveAtStart, Rng &rng)
	{
		AmafPlayout result = AmafPlayout();
		
		result.samples += SAMPLES;
		unsigned long long _cML, _cMR;	// The moves done by the current player 
		unsigned long long _oML, _oMR;	// The moves done by the opponent of the current player
		if (myMoveAtStart) {
			_cML = myMovesLeft;
			_cMR = myMovesRight;
			_oML = opMovesLeft;
			_oMR = opMovesRight;
		} else {
			_cML = opMovesLeft;
			_cMR = opMovesRight;
			_oML = myMovesLeft;
			_oMR = myMovesRight;
		}
		
		const bool myMoveAtEnd = myMoveAtStart ^ ((end & 1) == 1);	// Is it my move at the end of the game?
		int play[11];	// Stack that encodes possible moves that can be played based on patterns

		// Perform the given number of sample games
		for(int m = 0; m < SAMPLES; m++) {
			// The moves done by the current player 
			unsigned long long cML = _cML; 
			unsigned long long cMR = _cMR;
			
			// The moves done by the opponent of the current player
			unsigned long long oML = _oML;
			unsigned long long oMR = _oMR;
			
			int end = this->end;		// We use a copy of end to see which moves we can still do in this simulation run
			int lastMove = 0;		// The last move done by the opponent

			while(end > 0) {
				int move = 0;

				// Respond to the last opponent move based on patterns
				if(lastMove != 0) {
					int pc = 0;							// Index pointing to the top of the 'play' stack
					const std::vector<unsigned long long> &ps = patterns[lastMove];		// Patterns that we have to apply
					for(int i = 0; i < (int)ps.size(); i += 4) {
						// Check if pattern matches
						if((ps[i] & cML) == ps[i] && (ps[i + 1] & cMR) == ps[i + 1] && (ps[i + 2] & oML) == 0 && (ps[i + 3] & oMR) == 0 && !isSet(cML, cMR, (int)(ps[i + 3] >> 48))) {
							// Pattern matches, add the move corresponding to this pattern to the play stack
							play[pc++] = (int)(ps[i + 3] >> 48);
						}
					}
					
					if(pc > 0) {
						// Select a random move from the play stack
						move = play[rng.randomInt(pc)];
					}
				}
				
				// If the patterns did not result in a move, do a random move
				if(move == 0) {
					move = remainingMoves[rng.randomInt(end)];
					
					// Bias moves early in the game away from the edges, the idea is that more patterns will develop than fully random play
					if(end > 96) {
						// At the beginning of the game (first 10 moves), only play in the middle of the board
						while(edgeDistance[move] < 2) {
							move = remainingMoves[rng.randomInt(end)];
						}
					} else if(end > EDGE_BIAS_THRESHOLD) { 
						while(edgeDistance[move] < 1) {
							// Avoid moves at edges early in the simulation
							move = remainingMoves[rng.randomInt(end)];
						}
					}
				}

				// Remove the chosen move from available moves
				swapMoveIndices(positions[move], --end);

				// Add the move to current player
				if (move < 64) {
					cML |= 1ULL << move;
				} else {
					cMR |= 1ULL << (move - 64);
				}
				
				lastMove = move;
				
				// Swap players
				unsigned long long cML_ = cML;
				unsigned long long cMR_ = cMR;
				cML = oML;
				cMR = oMR;
				oML = cML_;
				oMR = cMR_;
			}

			// Did we win?
			// 1: we won
			// 0: we lost
			int win = myMoveAtEnd == (winner(cML, cMR) ? 1 : 0);

			// Update the AMAF playout result
			result.wins += win;
			for(int j = 1; j < POSITIONS + 1; j++) {
				if((myMoveAtEnd == isSet(cML, cMR, j))) { // We have set j
					result.mySamples[j]++;		// Our samples with this move
					result.myWins[j] += win;	// Our wins with this move
				} else {
					result.opSamples[j]++;		// Our samples when the opponent played this move
					result.opWins[j] += win;	// Our number of wins when the opponent played this move
				}
			}
		}

		return result;
	}

	// Is a given position set in the bitset given by l and r?
	bool isSet(unsigned long long l, unsigned long long r, int i)
	{
		return (i < 64 && ((1ULL << i) & l) != 0) || (i >= 64 && ((1ULL << (i - 64)) & r) != 0);
	}

	// Determine the winner given a board encoded in the bitset given by l and r
	bool winner(unsigned long long l, unsigned long long r)
	{
		int todo[POSITIONS];	// Stack for depth first search

		// l and r encode the positions on the board that have been played by us.
		// Note that we update l and r in this method to remove nodes that we have already seen in the DFS search
		// I.e. l and r encode the nodes played by us that we have not yet processed

		int corners = 0;	// The corners that we have captured

		// Do a depth first search from the positions along long the edge to find the edges connected from this position
		for(int i : edge) {
			if(isSet(l, r, i)) {	// Did we play this move?
				int top = 0;		// Index for the top of the stack
				todo[top++] = i;	// Start the search from position i
				
				int edges = 0;		// The edges connected by the current component
				while(top != 0) {
					// Process the node on the top of the stack
					
					int current = todo[--top];		// Pop one position from the stack
					edges |= ::edges[current];	// Update the edges reachable
					
					// Add neighbours of the current node to the stack
					for(int j = 0; neighbours[current][j] != 0; j++) {
						int n = neighbours[current][j];
						if(isSet(l, r, n)) {	// Is this node played by us?
							// Mark the neighbour as processed
							if (n < 64) {
								l &= ~(1ULL << n);
							} else {
								r &= ~(1ULL << (n - 64));
							}
							
							// Add the neighour to the top of the stack
							todo[top++] = n;
							
							// Optimization: we do not have to check the next neighbour
							// Proven by hand waving and the absence of a counter example
							j++;
						}
					}
				}
				
				// Update the corners captured by the connected edges 
				corners |= cornerSet[edges];
				
				// If we won with the given captured corners, we can stop
				if(win[corners]) {
					return true;
				}
			}
		}
		
		// We did not win
		return false;
	}
};

// The statistics stored in a node
class Statistics
{
private:
	friend class Tree;
	
	int samples;	// The number of times this node has been sampled
	int wins;		// The number of samples where we have won

	int amafSamples[POSITIONS + 1];		// amafSamples[i] is the number of times move i was played in a monte carlo game
	int amafWins[POSITIONS + 1];		// amafWins[i] is the number of times move i was played in a monte carlo game, and we won
	
	// Update the statistics with a given playout result
	void add(const AmafPlayout &playout, bool myMove)
	{
		samples += playout.samples;
		wins += playout.wins;
		
		if(myMove) {
			// If it is my move, add the statistics for my moves
			for(int i = 1; i < POSITIONS + 1; i++) {
				amafSamples[i] += playout.mySamples[i];
				amafWins[i] += playout.myWins[i];
			}
		} else {
			// If it is the opponent move, add the statistics for the opponent moves
			for(int i = 1; i < POSITIONS + 1; i++) {
				amafSamples[i] += playout.opSamples[i];
				amafWins[i] += playout.opWins[i];
			}
		}
	}
};

// Implementation of a tree node for monte carlo tree search (MTCS)
class Tree
{
private:
	friend class TreeBotFinal;
	
	GameState state;	// The game state at the current node
	bool myMove;		// Is it my move? (note that this could also be passed around instead of storing it in tree nodes)
	
	// Statistics gathered about child nodes based on the AMAF heuristic
	Statistics statistics;

	// A mapping of moves to child nodes
	// FIXME: turn this into a hash-map?
	Tree* children[POSITIONS + 1];

public:
	// Constructs a tree node given a state and whether it is my move
	Tree(const GameState &state, bool myMove)
		: state(state), myMove(myMove), statistics(), children() { }

	// Constructs a tree node with a default state
	Tree(bool myMove) : state(), myMove(myMove), statistics(), children() { }

	// Constructs a child node from a parent node and a given move
	Tree(const Tree &parent, int m)
		: state(parent.state), myMove(!parent.myMove), statistics(), children()
	{
		if(parent.myMove) state.updateMyMove(m);
		else state.updateOpMove(m);
	}

	// Destructs a tree node and frees all child nodes
	~Tree()
	{
		for (auto child : children) delete child;
	}

	// Gets the child node of this node for a given move
	// NOTE: this removes the subtree from its parent, to avoid double-freeing!
	Tree *treeAfterMove(int move)
	{
		Tree *child = children[move];
		if (child == nullptr) {
			return new Tree(*this, move);
		}
		children[move] = nullptr;
		return child;
	}

	// Computes the best move given some amount of computation time
	int findBestMove(double time, Rng &rng)
	{
		long long start = nanoTime();
		
		// Call expand() as long long as we have time
		int iterations = 0;
		while(state.end > 0) {
			for (int n = 0; n < 100; ++n)
				expand(rng);
			iterations += 100;
			if (nanoTime() - start >= time * 1000000000) break;
		}
		std::cerr << "Expanded " << iterations << " nodes." << std::endl;

		// Select the move with the highest number of samples
		int bestScore = -1;
		int bestMove = state.remainingMoves[0];
		for(int i = 0; i < state.end; i++) {
			int move = state.remainingMoves[i];
			const Tree *child = children[move];
			if(child != nullptr) {
				int score = child->statistics.samples;
				if(score > bestScore) {
					bestScore = score;
					bestMove = move;
				}
			}
		}

		return bestMove;
	}

	// Expands the tree by creating the most promising child node, playing a monte carlo playout in this child node, and updating the statistics in all parent nodes
	AmafPlayout expand(Rng &rng) {
		AmafPlayout result = AmafPlayout();

		// If there are no moves remaining in this node, we are done
		if(state.end == 0) return result;

		int selected = 0;
		
		// Select the best node for the current player
		if(myMove) {
			// Select the node with the highest win rate
			double bestScore = -1.0;
			for(int i = 0; i < state.end; i++) {
				int move = state.remainingMoves[i];
				
				// Compute the win rate based on the AMAF heuristic
				double score = ((double) statistics.amafWins[move]) / statistics.amafSamples[move];
				
				// If we have actual samples of this node available, we do a linear interpolation of the
				// AMAF score with the actual samples based on the ALPHA parameter (alpha-AMAF)
				const Tree *child = children[move];
				if(child != nullptr) {
					score = score * ALPHA + (((double) child->statistics.wins) / child->statistics.samples) * (1.0 - ALPHA);
				}
				
				// If there is no data at all available for this node, we must investigate it
				if(statistics.amafSamples[move] == 0) {
					score = 100.0;
				}

				if(score > bestScore) {
					bestScore = score;
					selected = move;
				}
			}
		} else {
			// Select the node with the lowest win rate
			double bestScore = -1.0;
			for(int i = 0; i < state.end; i++) {
				int move = state.remainingMoves[i];
				
				// Compute the win rate based on the AMAF heuristic
				double score = ((double) (statistics.amafSamples[move] - statistics.amafWins[move])) / statistics.amafSamples[move];
				
				// If we have actual samples of this node available, we do a linear interpolation of the
				// AMAF score with the actual samples based on the ALPHA parameter (alpha-AMAF)
				const Tree *child = children[move];
				if(child != nullptr) {
					score = score * ALPHA + (((double) (child->statistics.samples - child->statistics.wins)) / child->statistics.samples) * (1.0 - ALPHA);
				}
				
				// If there is no data at all available for this node, we must investigate it
				if(statistics.amafSamples[move] == 0) {
					score = 100.0;
				}
				
				if(score > bestScore) {
					bestScore = score;
					selected = move;
				}
			}
		}

		Tree *&child = children[selected];
		if(child == nullptr) {
			// If this child does not exist, create it
			child = new Tree(*this, selected);

			// Evaluate this node with monte-carlo sampling
			// The result is a AmafPlayout instance containing number of wins, samples and AMAF statistics (number of wins and samples for all other moves played)
			result = child->state.sample(child->myMove, rng);

			// Update the statistics of the child node
			child->statistics.add(result, child->myMove);
		} else {
			// The child exists, recursively expand this child
			result = child->expand(rng);
		}

		// Update the statistics of this node
		statistics.add(result, myMove);

		return result;
	}
};

// Our player
class TreeBotFinal
{
private:
	// The game tree for the current game position
	Tree *tree = nullptr;

	// The moves that have been played so far, used for querying the opening book
	std::vector<int> playedMoves;
	
	// Is this the first time we are playing?
	bool isFirst = true;

	// The random number generator.
	Rng rng;

public:
	TreeBotFinal(unsigned long long rng_seed = time(NULL))
		: rng(rng_seed)
	{
	}

	~TreeBotFinal()
	{
		delete tree;
	}

	int play(int lastMove, double remainingTime)
	{
		if(lastMove > 0) {
			playedMoves.push_back(lastMove);
		}
		
		// Process opponent move
		{
			Tree *old_tree = tree;
			if(lastMove > 0) {
				if(old_tree == nullptr) {
					// If there is no game tree yet, construct one
					old_tree = new Tree(false);
				}
				// Update the root of the tree to the child tree corresponding to the opponents move
				tree = old_tree->treeAfterMove(lastMove);
			} else {
				// I start the game
				if(lastMove == 0) {
					tree = new Tree(true);
				}

				// Opponent chose to swap places
				if(lastMove == -1) {
					old_tree->state.swapPlayers();
					tree = new Tree(old_tree->state, true);
				}
			}
			delete old_tree;
		}

		// The move that we are going to play
		int bestMove;

		if(isFirst && lastMove != 0 && (edgeDistance[lastMove] > 1 || lastMove == 15 || lastMove == 24 || lastMove == 71 || lastMove == 81 || lastMove == 96 || lastMove == 95 || lastMove == 74 || lastMove == 63 || lastMove == 18 || lastMove == 11)) {
			bestMove = -1;	// We swap for all symmetries of move 15, and for all center moves (edge distance > 1)
		} else {
			// Query the opening book
			bestMove = getOpeningMove(playedMoves);
			
			if(bestMove == 0) {
				// If the opening book has no entry, compute the best move
				bestMove = tree->findBestMove(std::max(remainingTime / TIME_DIVIDER, MINIMUM_TIME), rng);
				if(bestMove == 0) bestMove = tree->state.remainingMoves[0];
			}
		}

		// Update the game tree based on the move that we have selected
		{
			Tree *old_tree = tree;
			if(bestMove == -1) {
				old_tree->state.swapPlayers();
				tree = new Tree(tree->state, false);
			} else {
				// Update the root of the tree to the move corresponding to our move
				tree = old_tree->treeAfterMove(bestMove);
			}
			delete old_tree;
		}

		isFirst = false;

		if(bestMove != -1) {
			playedMoves.push_back(bestMove);
		}

		return bestMove;
	}

private:

	// Get a move from the opening book based on the moves played so far
	// Returns either the move from the opening book, or 0 if the opening book does not contain the given move sequence
	int getOpeningMove(const std::vector<int> &moves)
	{
		auto it = openingBook.find(moves);
		return it != openingBook.end() ? it->second : 0;
	}
};

// Plays the oppenent's given move, and returns the bot's response.
// If the move is 0, the bot will start.  (This is a function separate from
// main() so it can be called interactively in the  web frontend.)
int play(int move)
{
	static TreeBotFinal bot;
	static double remainingTime = TOTAL_TIME;

	long long start = nanoTime();

	int response = bot.play(move, remainingTime);

	long long end = nanoTime();
	double time = (double)(end - start)/1000000000;
	remainingTime -= time;

	std::cerr << response << std::endl;
	std::cerr << "Used " << time << " seconds, " << remainingTime << " seconds remaining." << std::endl;

	return response;
}

static int getMove()
{
	std::string line;
	std::getline(std::cin, line);
	int move;
	if (line == "Start") return 0;
	if (line == "Quit") exit(0);
	if (std::istringstream(line) >> move) return move;
	exit(1);
}

static void doMove(int position)
{
	std::cout << position << std::endl;
}

int main(int argc, char *argv[])
{
	while(true) {
		doMove(play(getMove()));
	}
}
