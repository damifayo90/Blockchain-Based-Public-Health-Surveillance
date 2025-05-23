;; Health Authority Verification Contract
;; Validates and manages authorized health monitoring agencies

(define-data-var admin principal tx-sender)

;; Map to store verified health authorities
(define-map verified-authorities principal bool)

;; Error codes
(define-constant err-not-admin (err u100))
(define-constant err-already-verified (err u101))
(define-constant err-not-verified (err u102))

;; Check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin)))

;; Add a new verified health authority
(define-public (add-authority (authority principal))
  (begin
    (asserts! (is-admin) err-not-admin)
    (asserts! (is-none (map-get? verified-authorities authority)) err-already-verified)
    (ok (map-set verified-authorities authority true))))

;; Remove a verified health authority
(define-public (remove-authority (authority principal))
  (begin
    (asserts! (is-admin) err-not-admin)
    (asserts! (is-some (map-get? verified-authorities authority)) err-not-verified)
    (ok (map-delete verified-authorities authority))))

;; Check if an authority is verified
(define-read-only (is-verified (authority principal))
  (default-to false (map-get? verified-authorities authority)))

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) err-not-admin)
    (ok (var-set admin new-admin))))
