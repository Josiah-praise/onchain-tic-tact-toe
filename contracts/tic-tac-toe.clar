;; the game-id to use for the next game
(define-data-var latest-game-id uint u0)

;; the tournament-id to use for the next tournament
(define-data-var latest-tournament-id uint u0)

(define-map games
uint
{
    player-one: principal,
    player-two: (optional principal),
    is-player-one-turn: bool,
    bet-amount: uint,
    winner: (optional principal),
    board: (list 9 uint),
    tournament-id: (optional uint)
}
)

(define-map tournaments uint {
    creator: principal,
    entry-fee: uint,
    max-players: uint,
    current-players: uint,
    status: uint, ;; 0=open, 1=in-progress, 2=completed
    winner: (optional principal),
    prize-pool: uint,
    created-at: uint
})

(define-map tournament-participants {tournament-id: uint, slot: uint} principal)

(define-map tournament-rounds {tournament-id: uint, round: uint, match: uint} uint)


(define-private (validate-move (board (list 9 uint)) (move-index uint) (move uint))
    (let (
        ;; Validate that the move is being played within range of the board
        (index-in-range (and (>= move-index u0) (< move-index u9)))

        ;; Validate that the move is either an X or an O
        (x-or-o (or (is-eq move u1) (is-eq move u2)))

        ;; Validate that the cell the move is being played on is currently empty
        (empty-spot (is-eq (unwrap! (element-at? board move-index) false) u0))
    )

    ;; All three conditions must be true for the move to be valid
    (and (is-eq index-in-range true) (is-eq x-or-o true) empty-spot)
))

(define-constant THIS_CONTRACT (as-contract tx-sender)) ;; The address of this contract itself
(define-constant ERR_MIN_BET_AMOUNT u100) ;; Error thrown when a player tries to create a game with a bet amount less than the minimum (0.0001 STX)
(define-constant ERR_INVALID_MOVE u101) ;; Error thrown when a move is invalid, i.e. not within range of the board or not an X or an O
(define-constant ERR_GAME_NOT_FOUND u102) ;; Error thrown when a game cannot be found given a Game ID, i.e. invalid Game ID
(define-constant ERR_GAME_CANNOT_BE_JOINED u103) ;; Error thrown when a game cannot be joined, usually because it already has two players
(define-constant ERR_NOT_YOUR_TURN u104) ;; Error thrown when a player tries to make a move when it is not their turn
(define-constant ERR_GAME_ALREADY_OVER u105) ;; Error thrown when trying to make a move in a game that already has a winner

;; Tournament error constants
(define-constant ERR_TOURNAMENT_NOT_FOUND u200)
(define-constant ERR_TOURNAMENT_FULL u201)
(define-constant ERR_TOURNAMENT_NOT_OPEN u202)
(define-constant ERR_INVALID_TOURNAMENT_SIZE u203)
(define-constant ERR_ALREADY_JOINED u204)
(define-constant ERR_NOT_TOURNAMENT_CREATOR u205)
(define-constant ERR_TOURNAMENT_NOT_READY u206)

(define-public (create-game (bet-amount uint) (move-index uint) (move uint))
    (let (
        ;; Get the Game ID to use for creation of this new game
        (game-id (var-get latest-game-id))
        ;; The initial starting board for the game with all cells empty
        (starting-board (list u0 u0 u0 u0 u0 u0 u0 u0 u0))
        ;; Updated board with the starting move played by the game creator (X)
        (game-board (unwrap! (replace-at? starting-board move-index move) (err ERR_INVALID_MOVE)))
        ;; Create the game data tuple (player one address, bet amount, game board, and mark next turn to be player two's turn)
        (game-data {
            player-one: contract-caller,
            player-two: none,
            is-player-one-turn: false,
            bet-amount: bet-amount,
            board: game-board,
            winner: none,
            tournament-id: none
        })
    )

    ;; Ensure that user has put up a bet amount greater than the minimum
    (asserts! (> bet-amount u0) (err ERR_MIN_BET_AMOUNT))
    ;; Ensure that the move being played is an `X`, not an `O`
    (asserts! (is-eq move u1) (err ERR_INVALID_MOVE))
    ;; Ensure that the move meets validity requirements
    (asserts! (validate-move starting-board move-index move) (err ERR_INVALID_MOVE))

    ;; Transfer the bet amount STX from user to this contract
    (try! (stx-transfer? bet-amount contract-caller THIS_CONTRACT))
    ;; Update the games map with the new game data
    (map-set games game-id game-data)
    ;; Increment the Game ID counter
    (var-set latest-game-id (+ game-id u1))

    ;; Log the creation of the new game
    (print { action: "create-game", data: game-data})
    ;; Return the Game ID of the new game
    (ok game-id)
))

(define-public (join-game (game-id uint) (move-index uint) (move uint))
    (let (
        ;; Load the game data for the game being joined, throw an error if Game ID is invalid
        (original-game-data (unwrap! (map-get? games game-id) (err ERR_GAME_NOT_FOUND)))
        ;; Get the original board from the game data
        (original-board (get board original-game-data))

        ;; Update the game board by placing the player's move at the specified index
        (game-board (unwrap! (replace-at? original-board move-index move) (err ERR_INVALID_MOVE)))
        ;; Update the copy of the game data with the updated board and marking the next turn to be player two's turn
        (game-data (merge original-game-data {
            board: game-board,
            player-two: (some contract-caller),
            is-player-one-turn: true
        }))
    )

    ;; Ensure that the game being joined is able to be joined
    ;; i.e. player-two is currently empty
    (asserts! (is-none (get player-two original-game-data)) (err ERR_GAME_CANNOT_BE_JOINED)) 
    ;; Ensure that the move being played is an `O`, not an `X`
    (asserts! (is-eq move u2) (err ERR_INVALID_MOVE))
    ;; Ensure that the move meets validity requirements
    (asserts! (validate-move original-board move-index move) (err ERR_INVALID_MOVE))

    ;; Transfer the bet amount STX from user to this contract
    (try! (stx-transfer? (get bet-amount original-game-data) contract-caller THIS_CONTRACT))
    ;; Update the games map with the new game data
    (map-set games game-id game-data)

    ;; Log the joining of the game
    (print { action: "join-game", data: game-data})
    ;; Return the Game ID of the game
    (ok game-id)
))

;; Given a board and three cells to look at on the board
;; Return true if all three are not empty and are the same value (all X or all O)
;; Return false if any of the three is empty or a different value
(define-private (is-line (board (list 9 uint)) (a uint) (b uint) (c uint)) 
    (let (
        ;; Value of cell at index a
        (a-val (unwrap! (element-at? board a) false))
        ;; Value of cell at index b
        (b-val (unwrap! (element-at? board b) false))
        ;; Value of cell at index c
        (c-val (unwrap! (element-at? board c) false))
    )

    ;; a-val must equal b-val and must also equal c-val while not being empty (non-zero)
    (and (is-eq a-val b-val) (is-eq a-val c-val) (not (is-eq a-val u0)))
))

;; Given a board, return true if any possible three-in-a-row line has been completed
(define-private (has-won (board (list 9 uint)))
    (or
        (is-line board u0 u1 u2) ;; Row 1
        (is-line board u3 u4 u5) ;; Row 2
        (is-line board u6 u7 u8) ;; Row 3
        (is-line board u0 u3 u6) ;; Column 1
        (is-line board u1 u4 u7) ;; Column 2
        (is-line board u2 u5 u8) ;; Column 3
        (is-line board u0 u4 u8) ;; Left to Right Diagonal
        (is-line board u2 u4 u6) ;; Right to Left Diagonal
    )
)

;; Given a board, return true if all cells are filled (no empty cells)
(define-private (is-board-full (board (list 9 uint)))
    (and
        (not (is-eq (unwrap! (element-at? board u0) false) u0))
        (not (is-eq (unwrap! (element-at? board u1) false) u0))
        (not (is-eq (unwrap! (element-at? board u2) false) u0))
        (not (is-eq (unwrap! (element-at? board u3) false) u0))
        (not (is-eq (unwrap! (element-at? board u4) false) u0))
        (not (is-eq (unwrap! (element-at? board u5) false) u0))
        (not (is-eq (unwrap! (element-at? board u6) false) u0))
        (not (is-eq (unwrap! (element-at? board u7) false) u0))
        (not (is-eq (unwrap! (element-at? board u8) false) u0))
    )
)

(define-public (play (game-id uint) (move-index uint) (move uint))
    (let (
        ;; Load the game data for the game being joined, throw an error if Game ID is invalid
        (original-game-data (unwrap! (map-get? games game-id) (err ERR_GAME_NOT_FOUND)))
        ;; Get the original board from the game data
        (original-board (get board original-game-data))

        ;; Is it player one's turn?
        (is-player-one-turn (get is-player-one-turn original-game-data))
        ;; Get the player whose turn it currently is based on the is-player-one-turn flag
        (player-turn (if is-player-one-turn (get player-one original-game-data) (unwrap! (get player-two original-game-data) (err ERR_GAME_NOT_FOUND))))
        ;; Get the expected move based on whose turn it is (X or O?)
        (expected-move (if is-player-one-turn u1 u2))

        ;; Update the game board by placing the player's move at the specified index
        (game-board (unwrap! (replace-at? original-board move-index move) (err ERR_INVALID_MOVE)))
        ;; Check if the game has been won now with this modified board
        (is-now-winner (has-won game-board))
        ;; Check if the board is now full (for draw detection)
        (is-board-now-full (is-board-full game-board))
        ;; Check if the game is over (either won or drawn)
        (is-game-over (or is-now-winner is-board-now-full))
        ;; Merge the game data with the updated board and marking the next turn to be player two's turn
        ;; Also mark the winner if the game has been won, or use a special value for draws
        (game-data (merge original-game-data {
            board: game-board,
            is-player-one-turn: (not is-player-one-turn),
            winner: (if is-now-winner
                        (some player-turn)
                        (if is-board-now-full
                            ;; Use the contract address to indicate a draw/tie
                            (some THIS_CONTRACT)
                            none))
        }))
    )

    ;; Ensure that the game is not already over (no winner exists)
    (asserts! (is-none (get winner original-game-data)) (err ERR_GAME_ALREADY_OVER))
    ;; Ensure that the function is being called by the player whose turn it is
    (asserts! (is-eq player-turn contract-caller) (err ERR_NOT_YOUR_TURN))
    ;; Ensure that the move being played is the correct move based on the current turn (X or O)
    (asserts! (is-eq move expected-move) (err ERR_INVALID_MOVE))
    ;; Ensure that the move meets validity requirements
    (asserts! (validate-move original-board move-index move) (err ERR_INVALID_MOVE))

    ;; Handle end game fund transfers
    (if is-game-over
        (if is-now-winner
            ;; Someone won: transfer all funds to the winner
            (try! (as-contract (stx-transfer? (* u2 (get bet-amount game-data)) tx-sender player-turn)))
            ;; Draw: return funds to both players
            (begin
                (try! (as-contract (stx-transfer? (get bet-amount game-data) tx-sender (get player-one original-game-data))))
                (try! (as-contract (stx-transfer? (get bet-amount game-data) tx-sender (unwrap! (get player-two original-game-data) (err ERR_GAME_NOT_FOUND)))))
            )
        )
        false
    )

    ;; Update the games map with the new game data
    (map-set games game-id game-data)

    ;; Log the action of a move being made
    (print {action: "play", data: game-data})
    ;; Return the Game ID of the game
    (ok game-id)
))

(define-read-only (get-game (game-id uint))
    (map-get? games game-id)
)

(define-read-only (get-latest-game-id)
    (var-get latest-game-id)
)

;; Tournament Functions

(define-private (is-valid-tournament-size (size uint))
    (or (is-eq size u4) (is-eq size u8) (is-eq size u16))
)

(define-private (is-player-in-tournament (tournament-id uint) (player principal))
    (or
        (is-eq (map-get? tournament-participants {tournament-id: tournament-id, slot: u0}) (some player))
        (is-eq (map-get? tournament-participants {tournament-id: tournament-id, slot: u1}) (some player))
        (is-eq (map-get? tournament-participants {tournament-id: tournament-id, slot: u2}) (some player))
        (is-eq (map-get? tournament-participants {tournament-id: tournament-id, slot: u3}) (some player))
        (is-eq (map-get? tournament-participants {tournament-id: tournament-id, slot: u4}) (some player))
        (is-eq (map-get? tournament-participants {tournament-id: tournament-id, slot: u5}) (some player))
        (is-eq (map-get? tournament-participants {tournament-id: tournament-id, slot: u6}) (some player))
        (is-eq (map-get? tournament-participants {tournament-id: tournament-id, slot: u7}) (some player))
        (is-eq (map-get? tournament-participants {tournament-id: tournament-id, slot: u8}) (some player))
        (is-eq (map-get? tournament-participants {tournament-id: tournament-id, slot: u9}) (some player))
        (is-eq (map-get? tournament-participants {tournament-id: tournament-id, slot: u10}) (some player))
        (is-eq (map-get? tournament-participants {tournament-id: tournament-id, slot: u11}) (some player))
        (is-eq (map-get? tournament-participants {tournament-id: tournament-id, slot: u12}) (some player))
        (is-eq (map-get? tournament-participants {tournament-id: tournament-id, slot: u13}) (some player))
        (is-eq (map-get? tournament-participants {tournament-id: tournament-id, slot: u14}) (some player))
        (is-eq (map-get? tournament-participants {tournament-id: tournament-id, slot: u15}) (some player))
    )
)

(define-public (create-tournament (entry-fee uint) (max-players uint))
    (let (
        (tournament-id (var-get latest-tournament-id))
        (tournament-data {
            creator: contract-caller,
            entry-fee: entry-fee,
            max-players: max-players,
            current-players: u1,
            status: u0,
            winner: none,
            prize-pool: entry-fee,
            created-at: stacks-block-height
        })
    )

    ;; Validations
    (asserts! (> entry-fee u0) (err ERR_MIN_BET_AMOUNT))
    (asserts! (is-valid-tournament-size max-players) (err ERR_INVALID_TOURNAMENT_SIZE))

    ;; Transfer entry fee
    (try! (stx-transfer? entry-fee contract-caller THIS_CONTRACT))

    ;; Create tournament
    (map-set tournaments tournament-id tournament-data)

    ;; Add creator as first participant
    (map-set tournament-participants {tournament-id: tournament-id, slot: u0} contract-caller)

    ;; Increment counter
    (var-set latest-tournament-id (+ tournament-id u1))

    ;; Log event
    (print {action: "create-tournament", tournament-id: tournament-id, creator: contract-caller})
    (ok tournament-id)
    )
)

(define-public (join-tournament (tournament-id uint))
    (let (
        (tournament (unwrap! (map-get? tournaments tournament-id) (err ERR_TOURNAMENT_NOT_FOUND)))
        (current-players (get current-players tournament))
        (max-players (get max-players tournament))
        (entry-fee (get entry-fee tournament))
        (new-slot current-players)
    )

    ;; Validations
    (asserts! (is-eq (get status tournament) u0) (err ERR_TOURNAMENT_NOT_OPEN))
    (asserts! (< current-players max-players) (err ERR_TOURNAMENT_FULL))
    (asserts! (not (is-player-in-tournament tournament-id contract-caller)) (err ERR_ALREADY_JOINED))

    ;; Transfer entry fee
    (try! (stx-transfer? entry-fee contract-caller THIS_CONTRACT))

    ;; Add player to tournament
    (map-set tournament-participants {tournament-id: tournament-id, slot: new-slot} contract-caller)

    ;; Update tournament data
    (map-set tournaments tournament-id (merge tournament {
        current-players: (+ current-players u1),
        prize-pool: (+ (get prize-pool tournament) entry-fee)
    }))

    ;; Log event
    (print {action: "join-tournament", tournament-id: tournament-id, player: contract-caller, slot: new-slot})
    (ok tournament-id)
    )
)

(define-public (start-tournament (tournament-id uint))
    (let (
        (tournament (unwrap! (map-get? tournaments tournament-id) (err ERR_TOURNAMENT_NOT_FOUND)))
    )

    ;; Validations
    (asserts! (is-eq (get creator tournament) contract-caller) (err ERR_NOT_TOURNAMENT_CREATOR))
    (asserts! (is-eq (get status tournament) u0) (err ERR_TOURNAMENT_NOT_OPEN))
    (asserts! (is-eq (get current-players tournament) (get max-players tournament)) (err ERR_TOURNAMENT_NOT_READY))

    ;; Update tournament status
    (map-set tournaments tournament-id (merge tournament {status: u1}))

    ;; Create first round games
    (try! (create-first-round-games tournament-id))

    ;; Log event
    (print {action: "start-tournament", tournament-id: tournament-id})
    (ok true)
    )
)

(define-private (create-first-round-games (tournament-id uint))
    (let (
        (tournament (unwrap! (map-get? tournaments tournament-id) (err ERR_TOURNAMENT_NOT_FOUND)))
        (max-players (get max-players tournament))
    )

    ;; Create games based on tournament size
    (if (is-eq max-players u4)
        (begin
            (try! (create-single-game tournament-id u1 u0 u0 u1))
            (try! (create-single-game tournament-id u1 u1 u2 u3))
            (ok true)
        )
        (if (is-eq max-players u8)
            (begin
                (try! (create-single-game tournament-id u1 u0 u0 u1))
                (try! (create-single-game tournament-id u1 u1 u2 u3))
                (try! (create-single-game tournament-id u1 u2 u4 u5))
                (try! (create-single-game tournament-id u1 u3 u6 u7))
                (ok true)
            )
            (if (is-eq max-players u16)
                (begin
                    (try! (create-single-game tournament-id u1 u0 u0 u1))
                    (try! (create-single-game tournament-id u1 u1 u2 u3))
                    (try! (create-single-game tournament-id u1 u2 u4 u5))
                    (try! (create-single-game tournament-id u1 u3 u6 u7))
                    (try! (create-single-game tournament-id u1 u4 u8 u9))
                    (try! (create-single-game tournament-id u1 u5 u10 u11))
                    (try! (create-single-game tournament-id u1 u6 u12 u13))
                    (try! (create-single-game tournament-id u1 u7 u14 u15))
                    (ok true)
                )
                (ok true)
            )
        )
    )
    )
)

(define-private (create-single-game (tournament-id uint) (round uint) (match-index uint) (player1-slot uint) (player2-slot uint))
    (let (
        (tournament (unwrap! (map-get? tournaments tournament-id) (err ERR_TOURNAMENT_NOT_FOUND)))
        (player1 (unwrap! (map-get? tournament-participants {tournament-id: tournament-id, slot: player1-slot}) (err ERR_TOURNAMENT_NOT_FOUND)))
        (player2 (unwrap! (map-get? tournament-participants {tournament-id: tournament-id, slot: player2-slot}) (err ERR_TOURNAMENT_NOT_FOUND)))
        (game-id (var-get latest-game-id))
        (game-data {
            player-one: player1,
            player-two: (some player2),
            is-player-one-turn: true,
            bet-amount: (get entry-fee tournament),
            board: (list u0 u0 u0 u0 u0 u0 u0 u0 u0),
            winner: none,
            tournament-id: (some tournament-id)
        })
    )

    ;; Create tournament game
    (map-set games game-id game-data)
    (map-set tournament-rounds {tournament-id: tournament-id, round: round, match: match-index} game-id)
    (var-set latest-game-id (+ game-id u1))
    (ok true)
    )
)

;; Read-only functions for tournaments

(define-read-only (get-tournament (tournament-id uint))
    (map-get? tournaments tournament-id)
)

(define-read-only (get-latest-tournament-id)
    (var-get latest-tournament-id)
)

(define-read-only (get-tournament-participant (tournament-id uint) (slot uint))
    (map-get? tournament-participants {tournament-id: tournament-id, slot: slot})
)

(define-read-only (get-tournament-game (tournament-id uint) (round uint) (match-num uint))
    (match (map-get? tournament-rounds {tournament-id: tournament-id, round: round, match: match-num})
        game-id (map-get? games game-id)
        none
    )
)

