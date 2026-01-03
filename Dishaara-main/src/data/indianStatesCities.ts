/**
 * Indian States and Cities Data
 * List of all Indian states and their major cities for dropdown selection
 */

export interface StateCity {
  state: string;
  cities: string[];
}

export const INDIAN_STATES_CITIES: StateCity[] = [
  {
    state: "Andhra Pradesh",
    cities: ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Kakinada", "Kadapa", "Anantapur"]
  },
  {
    state: "Arunachal Pradesh",
    cities: ["Itanagar", "Naharlagun", "Tawang", "Bomdila", "Pasighat", "Ziro", "Daporijo", "Tezu", "Namsai"]
  },
  {
    state: "Assam",
    cities: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Karimganj", "Sivasagar", "Goalpara"]
  },
  {
    state: "Bihar",
    cities: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Arrah", "Begusarai", "Katihar", "Chhapra"]
  },
  {
    state: "Chhattisgarh",
    cities: ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajgarh", "Rajnandgaon", "Jagdalpur", "Raigarh", "Ambikapur"]
  },
  {
    state: "Goa",
    cities: ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim", "Valpoi", "Curchorem", "Canacona", "Quepem"]
  },
  {
    state: "Gujarat",
    cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Junagadh", "Gandhidham", "Anand"]
  },
  {
    state: "Haryana",
    cities: ["Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula"]
  },
  {
    state: "Himachal Pradesh",
    cities: ["Shimla", "Mandi", "Solan", "Dharamshala", "Bilaspur", "Kullu", "Chamba", "Hamirpur", "Una", "Nahan"]
  },
  {
    state: "Jharkhand",
    cities: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh", "Deoghar", "Giridih", "Phusro", "Ramgarh", "Mango"]
  },
  {
    state: "Karnataka",
    cities: ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum", "Gulbarga", "Davangere", "Bellary", "Bijapur", "Raichur"]
  },
  {
    state: "Kerala",
    cities: ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Malappuram", "Kannur", "Kollam", "Palakkad", "Alappuzha", "Manjeri"]
  },
  {
    state: "Madhya Pradesh",
    cities: ["Indore", "Bhopal", "Gwalior", "Jabalpur", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa"]
  },
  {
    state: "Maharashtra",
    cities: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Thane", "Kalyan", "Vasai-Virar", "Navi Mumbai"]
  },
  {
    state: "Manipur",
    cities: ["Imphal", "Thoubal", "Kakching", "Lilong", "Mayang Imphal", "Yairipok", "Moirang", "Bishnupur", "Churachandpur"]
  },
  {
    state: "Meghalaya",
    cities: ["Shillong", "Tura", "Jowai", "Nongpoh", "Nongstoin", "Baghmara", "Williamnagar", "Resubelpara", "Ampati"]
  },
  {
    state: "Mizoram",
    cities: ["Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib", "Serchhip", "Lawngtlai", "Mamit", "Khawzawl"]
  },
  {
    state: "Nagaland",
    cities: ["Dimapur", "Kohima", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Phek", "Mon", "Kiphire", "Longleng"]
  },
  {
    state: "Odisha",
    cities: ["Bhubaneswar", "Cuttack", "Rourkela", "Brahmapur", "Sambalpur", "Puri", "Baleshwar", "Bhadrak", "Baripada", "Jharsuguda"]
  },
  {
    state: "Punjab",
    cities: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Pathankot", "Hoshiarpur", "Batala", "Moga", "Abohar"]
  },
  {
    state: "Rajasthan",
    cities: ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar"]
  },
  {
    state: "Sikkim",
    cities: ["Gangtok", "Namchi", "Mangan", "Gyalshing", "Singtam", "Rangpo", "Jorethang", "Ravangla", "Pakyong"]
  },
  {
    state: "Tamil Nadu",
    cities: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode", "Vellore", "Tuticorin", "Dindigul"]
  },
  {
    state: "Telangana",
    cities: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Ramagundam", "Khammam", "Mahbubnagar", "Nalgonda", "Adilabad", "Siddipet"]
  },
  {
    state: "Tripura",
    cities: ["Agartala", "Udaipur", "Dharmanagar", "Pratapgarh", "Kailasahar", "Belonia", "Khowai", "Teliamura", "Ambassa"]
  },
  {
    state: "Uttar Pradesh",
    cities: ["Lucknow", "Kanpur", "Agra", "Varanasi", "Allahabad", "Meerut", "Ghaziabad", "Aligarh", "Bareilly", "Moradabad"]
  },
  {
    state: "Uttarakhand",
    cities: ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur", "Rishikesh", "Nainital", "Mussoorie", "Almora"]
  },
  {
    state: "West Bengal",
    cities: ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda", "Kharagpur", "Baharampur", "Habra"]
  },
  {
    state: "Delhi",
    cities: ["New Delhi", "Central Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "North East Delhi", "North West Delhi", "South West Delhi", "Shahdara"]
  },
  {
    state: "Jammu and Kashmir",
    cities: ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Sopore", "Kathua", "Udhampur", "Punch", "Rajouri", "Doda"]
  },
  {
    state: "Ladakh",
    cities: ["Leh", "Kargil", "Drass", "Nubra", "Zanskar", "Dah", "Hanu", "Khalatse", "Chushul"]
  }
];

/**
 * Get cities for a given state
 */
export function getCitiesForState(state: string): string[] {
  const stateData = INDIAN_STATES_CITIES.find(
    (sc) => sc.state.toLowerCase() === state.toLowerCase()
  );
  return stateData ? stateData.cities : [];
}

/**
 * Get all state names
 */
export function getAllStates(): string[] {
  return INDIAN_STATES_CITIES.map((sc) => sc.state);
}

