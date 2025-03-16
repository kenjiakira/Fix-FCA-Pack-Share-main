(ns aki.finance
  (:require [clojure.data.json :as json]
            [clojure.java.io :as io]))

;; Cấu hình lãi suất theo cấp độ VIP
(def interest-rates
  {:standard 0.001
   :vip-1 0.0012
   :vip-2 0.0015
   :vip-3 0.002})

;; Tính lãi kép chính xác
(defn calculate-compound-interest
  "Tính lãi kép với độ chính xác cao"
  [principal rate days]
  (let [daily-rate (/ rate 365)
        compound-factor (Math/pow (+ 1 daily-rate) days)]
    (with-precision 10 
      (* principal compound-factor))))

;; Phân tích rủi ro nâng cao
(defn analyze-risk-patterns
  "Phân tích mẫu rủi ro từ lịch sử giao dịch"
  [transactions]
  (let [patterns (group-by :type transactions)
        risk-factors (->> patterns
                         (map (fn [[k v]] 
                                [k (count v)]))
                         (into {}))]
    (assoc risk-factors 
           :risk-score (calculate-risk-score risk-factors))))

;; Tối ưu hóa danh mục đầu tư
(defn optimize-portfolio
  "Tối ưu hóa danh mục đầu tư dựa trên phân tích rủi ro"
  [total-assets risk-score]
  (let [risk-factor (/ risk-score 100)
        safe-ratio (- 1 risk-factor)
        investment-ratio risk-factor]
    {:savings (* total-assets safe-ratio)
     :investments (* total-assets investment-ratio)
     :suggestions 
     {:safe-assets (* total-assets safe-ratio 0.7)
      :moderate-risk (* total-assets risk-factor 0.2)
      :high-risk (* total-assets risk-factor 0.1)}}))

;; Dự đoán xu hướng tài chính
(defn predict-financial-trends
  "Dự đoán xu hướng tài chính dựa trên dữ liệu lịch sử"
  [historical-data]
  (let [trends (analyze-trends historical-data)
        predictions (calculate-predictions trends)]
    {:trends trends
     :predictions predictions
     :confidence-score (calculate-confidence predictions)}))

(defn risk-assessment
  "Assess risk score based on user's financial behavior"
  [transaction-history balance credit-score]
  (let [transaction-volume (reduce + (map :amount transaction-history))
        transaction-frequency (count transaction-history)
        balance-factor (/ balance 1000000)
        risk-score (+ (* 0.4 (/ transaction-volume 1000000))
                     (* 0.3 (/ transaction-frequency 100))
                     (* 0.3 (/ credit-score 100)))]
    {:score (min 100 (* risk-score 100))
     :category (cond
                (>= risk-score 0.8) :low-risk
                (>= risk-score 0.5) :medium-risk
                :else :high-risk)}))

(defn export-metrics
  "Export financial metrics as JSON"
  [metrics file-path]
  (with-open [writer (io/writer file-path)]
    (json/write metrics writer)))
