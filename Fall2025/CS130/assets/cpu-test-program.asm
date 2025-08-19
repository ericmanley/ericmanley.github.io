.text

addi $s0, $0, 3
addi $s1, $0, 5
addi $s2, $0, 15

add  $t0, $s1, $s1
sub  $t1, $s1, $s0
and  $t2, $s1, $s2
andi $t3, $s1, 11
or   $t4, $s0, $s1
ori  $t5, $s0, 0
slt  $t6, $s0, $s1
slti $t7, $s2, -1234
xor  $t8, $s0, $s1
xori $t9, $s2, 28

beq  $0, $0, brequ
addi $s6, $0, 1234

brequ:
bne $s0, $s1, brnequ
addi $s7, $0, 5678

brnequ:
