import Text "mo:base/Text";
import Float "mo:base/Float";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Char "mo:base/Char";
import LLM "mo:llm";

persistent actor KaloriTracker {
    
    // Data types
    type ExerciseResult = {
        calories: Float;
        llm_advice: Text;
        health_tips: [Text];
        motivational_message: Text;
        category: Text;
    };
    
    type LLMAnalysis = {
        detailed_advice: Text;
        health_tips: [Text];
        motivational_message: Text;
        category: Text;
        weekly_plan: Text;
    };
    
    // Function untuk menghitung kalori (tetap sama seperti sebelumnya)
    public query func cekKalori(
        berat: Float, 
        durasi: Float, 
        olahraga: Text, 
        intensitas: Text
    ) : async Float {
        var faktor : Float = 0.07;
        if (olahraga == "lari") {
            if (intensitas == "ringan") {
                faktor := 0.09;
            } else if (intensitas == "sedang") {
                faktor := 0.12;
            } else if (intensitas == "berat") {
                faktor := 0.16;
            };
        } else if (olahraga == "bersepeda") {
            if (intensitas == "ringan") {
                faktor := 0.05;
            } else if (intensitas == "sedang") {
                faktor := 0.08;
            } else if (intensitas == "berat") {
                faktor := 0.12;
            };
        } else if (olahraga == "renang") {
            if (intensitas == "ringan") {
                faktor := 0.07;
            } else if (intensitas == "sedang") {
                faktor := 0.11;
            } else if (intensitas == "berat") {
                faktor := 0.15;
            };
        } else if (olahraga == "jalan") {
            if (intensitas == "ringan") {
                faktor := 0.04;
            } else if (intensitas == "sedang") {
                faktor := 0.06;
            } else if (intensitas == "berat") {
                faktor := 0.09;
            };
        };
        return berat * durasi * faktor;
    };

    // LLM-powered exercise analysis dengan prompt yang detail
    private func analyzeExerciseWithLLM(
        berat: Float, 
        durasi: Float, 
        olahraga: Text, 
        intensitas: Text, 
        calories: Float
    ) : async LLMAnalysis {
        let prompt = "Sebagai pelatih fitness dan ahli nutrisi profesional, berikan analisis komprehensif untuk aktivitas olahraga berikut:\n\n" #
                    "FORMAT RESPONSE EXACT:\n" #
                    "ADVICE: [saran detail 3-4 kalimat tentang teknik, pemanasan, dan optimalisasi]\n" #
                    "TIP1: [tips kesehatan spesifik]\n" #
                    "TIP2: [tips nutrisi atau hidrasi]\n" #
                    "TIP3: [tips recovery atau istirahat]\n" #
                    "MOTIVATION: [pesan motivasi personal 2 kalimat]\n" #
                    "CATEGORY: [pilih satu: Cardio/Strength/Endurance/Recovery]\n" #
                    "PLAN: [rencana latihan minggu depan 2-3 kalimat]\n\n" #
                    "DATA OLAHRAGA:\n" #
                    "- Jenis: " # olahraga # "\n" #
                    "- Intensitas: " # intensitas # "\n" #
                    "- Durasi: " # Float.toText(durasi) # " menit\n" #
                    "- Berat badan: " # Float.toText(berat) # " kg\n" #
                    "- Kalori terbakar: " # Float.toText(calories) # " kkal\n\n" #
                    "CONTOH FORMAT:\n" #
                    "ADVICE: Untuk lari intensitas sedang, pastikan pemanasan 5-10 menit dengan stretching dinamis. Jaga postur tubuh tegak, ayunan lengan rileks, dan pendaratan kaki di mid-foot. Atur napas dengan ritma konsisten.\n" #
                    "TIP1: Gunakan sepatu lari yang sesuai dengan bentuk kaki\n" #
                    "TIP2: Minum air 200ml sebelum dan sesudah lari\n" #
                    "TIP3: Lakukan cool down dengan jalan santai 5 menit\n" #
                    "MOTIVATION: Hebat! Kamu sudah membakar " # Float.toText(calories) # " kalori hari ini. Konsistensi adalah kunci menuju tubuh yang lebih sehat!\n" #
                    "CATEGORY: Cardio\n" #
                    "PLAN: Minggu depan tingkatkan durasi 5 menit atau coba interval training 1 menit cepat, 2 menit santai. Variasi akan membuat progress lebih optimal.\n\n" #
                    "SEKARANG ANALISIS DATA DI ATAS DENGAN FORMAT EXACT:";
        
        let llmResponse = await LLM.prompt(#Llama3_1_8B, prompt);
        parseLLMExerciseResponse(llmResponse, olahraga, intensitas, calories);
    };
    
    // Parse LLM response untuk exercise analysis
    private func parseLLMExerciseResponse(response: Text, olahraga: Text, intensitas: Text, calories: Float) : LLMAnalysis {
        let advice = extractValueAfterMarker(response, "ADVICE:");
        let tip1 = extractValueAfterMarker(response, "TIP1:");
        let tip2 = extractValueAfterMarker(response, "TIP2:");
        let tip3 = extractValueAfterMarker(response, "TIP3:");
        let motivation = extractValueAfterMarker(response, "MOTIVATION:");
        let category = extractValueAfterMarker(response, "CATEGORY:");
        let plan = extractValueAfterMarker(response, "PLAN:");
        
        // Fallback values jika parsing gagal
        let finalAdvice = if (Text.size(advice) > 0) { advice } else { 
            generateFallbackAdvice(olahraga, intensitas) 
        };
        
        let finalTips = [
            if (Text.size(tip1) > 0) { tip1 } else { "Jaga konsistensi latihan untuk hasil optimal" },
            if (Text.size(tip2) > 0) { tip2 } else { "Perbanyak minum air putih sebelum dan sesudah olahraga" },
            if (Text.size(tip3) > 0) { tip3 } else { "Istirahat cukup untuk recovery otot" }
        ];
        
        let finalMotivation = if (Text.size(motivation) > 0) { motivation } else {
            "Bagus! Kamu sudah membakar " # Float.toText(calories) # " kalori. Keep going! 💪"
        };
        
        let finalCategory = if (Text.size(category) > 0) { category } else { "Cardio" };
        
        let finalPlan = if (Text.size(plan) > 0) { plan } else {
            "Minggu depan coba tingkatkan durasi atau intensitas secara bertahap untuk progress yang lebih baik."
        };
        
        {
            detailed_advice = finalAdvice;
            health_tips = finalTips;
            motivational_message = finalMotivation;
            category = finalCategory;
            weekly_plan = finalPlan;
        }
    };
    
    // Generate fallback advice jika LLM gagal
    private func generateFallbackAdvice(olahraga: Text, intensitas: Text) : Text {
        if (olahraga == "lari") {
            if (intensitas == "ringan") {
                "Lari ringan bagus untuk pemula. Jaga postur tubuh tegak, landing dengan mid-foot, dan atur napas dengan ritma yang konsisten. Lakukan pemanasan sebelum lari dan pendinginan setelahnya."
            } else if (intensitas == "sedang") {
                "Lari intensitas sedang efektif untuk meningkatkan daya tahan. Pastikan sepatu yang nyaman, jaga hidrasi, dan dengarkan tubuh Anda. Tingkatkan pace secara bertahap."
            } else {
                "Lari intensitas tinggi memerlukan persiapan matang. Pemanasan minimal 10 menit, jaga form yang benar, dan hindari overtraining. Recovery yang cukup sangat penting."
            }
        } else if (olahraga == "bersepeda") {
            "Bersepeda adalah olahraga low-impact yang bagus untuk sendi. Atur tinggi sadel yang tepat, gunakan helm untuk keamanan, dan variasikan medan untuk tantangan yang berbeda."
        } else if (olahraga == "renang") {
            "Renang melatih seluruh tubuh dengan minimal risiko cedera. Fokus pada teknik pernapasan yang benar, variasikan gaya renang, dan jangan lupa pemanasan di luar air."
        } else {
            "Jalan kaki adalah olahraga yang mudah dan aman. Gunakan sepatu yang nyaman, jaga postur tegak, dan ayunkan lengan secara alami. Bisa dilakukan kapan saja."
        }
    };
    
    // Extract value setelah marker (sama seperti di CarbonTracker)
    private func extractValueAfterMarker(text: Text, marker: Text) : Text {
        let lines = Text.split(text, #char '\n');
        let linesArray = Iter.toArray(lines);
        
        for (line in linesArray.vals()) {
            if (Text.startsWith(line, #text marker)) {
                let markerSize = Text.size(marker);
                if (Text.size(line) > markerSize) {
                    let afterMarker = Text.trimStart(textSlice(line, markerSize), #char ' ');
                    return Text.trim(afterMarker, #char ' ');
                };
            };
        };
        ""
    };
    
    // Helper function untuk slice text
    private func textSlice(text: Text, start: Nat) : Text {
        let chars = Text.toIter(text);
        let charsArray = Iter.toArray(chars);
        
        if (start >= charsArray.size()) {
            return "";
        };
        
        let slicedChars = Array.tabulate<Char>(charsArray.size() - start, func(i) = charsArray[start + i]);
        Text.fromIter(slicedChars.vals())
    };
    
    // Main function dengan LLM integration
    public func cekKaloriDenganLLM(
        berat: Float, 
        durasi: Float, 
        olahraga: Text, 
        intensitas: Text
    ) : async ExerciseResult {
        try {
            // Hitung kalori dulu
            let calories = await cekKalori(berat, durasi, olahraga, intensitas);
            
            // Get LLM analysis
            let analysis = await analyzeExerciseWithLLM(berat, durasi, olahraga, intensitas, calories);
            
            {
                calories = calories;
                llm_advice = analysis.detailed_advice;
                health_tips = analysis.health_tips;
                motivational_message = analysis.motivational_message;
                category = analysis.category;
            }
        } catch (error) {
            // Fallback jika LLM gagal
            let calories = await cekKalori(berat, durasi, olahraga, intensitas);
            
            {
                calories = calories;
                llm_advice = generateFallbackAdvice(olahraga, intensitas);
                health_tips = [
                    "Jaga konsistensi latihan untuk hasil optimal",
                    "Perbanyak minum air putih sebelum dan sesudah olahraga", 
                    "Istirahat cukup untuk recovery otot"
                ];
                motivational_message = "Bagus! Kamu sudah membakar " # Float.toText(calories) # " kalori. Keep going! 💪";
                category = "Cardio";
            }
        }
    };
    
    // Function saran original (tetap ada untuk compatibility)
    public query func saran(
        olahraga: Text, 
        intensitas: Text
    ) : async Text {
        if (olahraga == "jalan" and intensitas == "ringan") {
            return "Bagus untuk pemula! Tingkatkan durasi secara bertahap.";
        } else if (olahraga == "lari" and intensitas == "berat") {
            return "Pastikan pemanasan dan hidrasi cukup sebelum lari intensitas berat.";
        } else if (olahraga == "renang") {
            return "Renang baik untuk semua level, pastikan teknik yang benar.";
        } else {
            return "Tetap jaga konsistensi dan sesuaikan dengan kondisi tubuh.";
        }
    };
    
    // Generate weekly workout plan dengan LLM
    public func buatRencanaMingguan(
        berat: Float,
        tujuan: Text, // "weight_loss", "muscle_gain", "endurance", "general_health"
        level: Text,  // "beginner", "intermediate", "advanced"
        waktu_tersedia: Float // menit per hari
    ) : async Text {
        let prompt = "Sebagai personal trainer bersertifikat, buat rencana olahraga mingguan yang detail dan realistis:\n\n" #
                    "PROFIL CLIENT:\n" #
                    "- Berat badan: " # Float.toText(berat) # " kg\n" #
                    "- Tujuan: " # tujuan # "\n" #
                    "- Level: " # level # "\n" #
                    "- Waktu tersedia: " # Float.toText(waktu_tersedia) # " menit/hari\n\n" #
                    "BUAT RENCANA 7 HARI dengan format:\n" #
                    "📅 HARI 1 (Senin): [Jenis olahraga] - [durasi] menit\n" #
                    "   💡 Focus: [target spesifik]\n" #
                    "   ⚠️  Tips: [tips penting]\n\n" #
                    "Sertakan:\n" #
                    "- Variasi olahraga yang seimbang\n" #
                    "- Rest day yang sesuai\n" #
                    "- Progression yang realistic\n" #
                    "- Tips nutrisi dan recovery\n\n" #
                    "Maksimal 400 kata, gunakan emoji dan bahasa motivating:";
        
        try {
            let plan = await LLM.prompt(#Llama3_1_8B, prompt);
            
            if (Text.size(plan) > 50) {
                plan
            } else {
                generateFallbackWeeklyPlan(tujuan, level, waktu_tersedia)
            }
        } catch (error) {
            generateFallbackWeeklyPlan(tujuan, level, waktu_tersedia)
        }
    };
    
    // Fallback weekly plan
    private func generateFallbackWeeklyPlan(tujuan: Text, level: Text, waktu: Float) : Text {
        "📅 RENCANA MINGGUAN WORKOUT:\n\n" #
        "📅 SENIN: Cardio Ringan - " # Float.toText(waktu * 0.8) # " menit\n" #
        "   💡 Focus: Pemanasan tubuh untuk minggu baru\n" #
        "   ⚠️  Tips: Jangan terlalu keras di hari pertama\n\n" #
        "📅 SELASA: Strength Training - " # Float.toText(waktu) # " menit\n" #
        "   💡 Focus: Upper body atau full body\n" #
        "   ⚠️  Tips: Form yang benar lebih penting dari beban berat\n\n" #
        "📅 RABU: Active Recovery - " # Float.toText(waktu * 0.6) # " menit\n" #
        "   💡 Focus: Jalan santai atau yoga ringan\n" #
        "   ⚠️  Tips: Fokus pada stretching dan mobility\n\n" #
        "📅 KAMIS: Cardio Intensitas Sedang\n" #
        "📅 JUMAT: Strength Training\n" #
        "📅 SABTU: Olahraga favorit (fun activity)\n" #
        "📅 MINGGU: Rest Day\n\n" #
        "🎯 Konsistensi adalah kunci! Start small, stay consistent! 💪"
    };
}